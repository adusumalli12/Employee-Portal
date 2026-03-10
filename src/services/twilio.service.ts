import twilio from 'twilio';
import env from '../config/environment';

interface SMSResult {
  success: boolean;
  messageSid?: string;
  status?: string;
  to?: string;
  from?: string;
  body?: string;
  dateCreated?: Date;
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: Date;
}

class TwilioService {
  private static instance: TwilioService;
  private client: ReturnType<typeof twilio> | null = null;
  private phoneNumber: string = '';

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  /**
   * Normalize environment variable (remove quotes)
   */
  private normalizeEnv(value: string | undefined | null): string {
    if (!value) return '';
    const v = String(value).trim();
    // Strip wrapping single/double quotes from .env like "ACxxx" or 'ACxxx'
    return v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();
  }

  /**
   * Get or initialize Twilio client
   */
  private getClient(): ReturnType<typeof twilio> {
    if (this.client) return this.client;

    const accountSid = this.normalizeEnv(env.TWILIO_ACCOUNT_SID);
    const authToken = this.normalizeEnv(env.TWILIO_AUTH_TOKEN);
    const phoneNumber = this.normalizeEnv(env.TWILIO_PHONE_NUMBER);

    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error(
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .ENV'
      );
    }

    if (!accountSid.startsWith('AC')) {
      const preview = `${accountSid.slice(0, 4)}... (len=${accountSid.length})`;
      throw new Error(
        `Invalid TWILIO_ACCOUNT_SID. Expected to start with "AC". Server read: ${preview}. ` +
          `Check your .ENV line has no spaces, e.g. TWILIO_ACCOUNT_SID=ACxxxxxxxx`
      );
    }

    this.phoneNumber = phoneNumber;
    this.client = twilio(accountSid, authToken);
    return this.client;
  }

  /**
   * Send SMS message
   * @param to - Recipient phone number (E.164 format: +1234567890)
   * @param message - Message body
   */
  async sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
      const client = this.getClient();

      if (!to || !message) {
        throw new Error('Phone number and message are required');
      }

      // Validate phone number format (should start with +)
      if (!to.startsWith('+')) {
        throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
      }

      const result = (await client.messages.create({
        body: message,
        from: this.phoneNumber,
        to,
      })) as unknown as TwilioMessageResponse;

      console.log(`[Twilio] SMS sent successfully to ${to}, SID: ${result.sid}`);

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: result.body,
        dateCreated: result.dateCreated,
      };
    } catch (error: any) {
      console.error('[Twilio] SMS Error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageSid: string): Promise<string> {
    try {
      const client = this.getClient();
      const message = await client.messages(messageSid).fetch();
      return message.status;
    } catch (error: any) {
      console.error('[Twilio] Error fetching message status:', error);
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }
}

export default TwilioService.getInstance();
