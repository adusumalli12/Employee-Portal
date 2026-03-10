import EmailService from './email.service';
import TwilioService from './twilio.service';

export interface OTPVerificationResult {
  valid: boolean;
  reason?: 'OTP_EXPIRED' | 'OTP_MISMATCH' | 'OTP_NOT_FOUND';
}

export interface OTPSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

class OTPService {
  /**
   * Generate a 6-digit OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get OTP expiry time (minutes from now)
   */
  static getOTPExpiry(minutesFromNow: number = 10): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
    return expiry;
  }

  /**
   * Send OTP via Email
   */
  static async sendOTPViaEmail(
    email: string,
    name: string,
    otp: string,
    context: 'signup' | 'forgot-password' | 'email-verification' | 'password-change' = 'signup',
    expiryMinutes: number = 10
  ): Promise<OTPSendResult> {
    try {
      await EmailService.sendOTPEmail(email, name, otp, context, expiryMinutes);
      console.log(`[OTP] Email OTP sent to ${email}`);
      return { success: true };
    } catch (error: any) {
      console.error('[OTP] Error sending OTP email:', error.message);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  /**
   * Send OTP via SMS
   */
  static async sendOTPViaSMS(
    phoneNumber: string,
    otp: string,
    context: string = 'signup'
  ): Promise<OTPSendResult> {
    try {
      const message = `Your OTP for ${context} is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
      const result = await TwilioService.sendSMS(phoneNumber, message);

      console.log(`[OTP] SMS OTP sent to ${phoneNumber}`);
      return { success: true };
    } catch (error: any) {
      console.error('[OTP] Error sending OTP SMS:', error.message);
      throw new Error(`Failed to send OTP SMS: ${error.message}`);
    }
  }

  /**
   * Verify OTP
   */
  static verifyOTP(
    submittedOTP: string,
    storedOTP: string | null | undefined,
    otpExpiry: Date | null | undefined
  ): OTPVerificationResult {
    // Check if OTP exists
    if (!storedOTP) {
      return {
        valid: false,
        reason: 'OTP_NOT_FOUND',
      };
    }

    // Check if OTP expired
    if (otpExpiry && new Date() > otpExpiry) {
      return {
        valid: false,
        reason: 'OTP_EXPIRED',
      };
    }

    // Check if OTP matches
    if (submittedOTP !== storedOTP) {
      return {
        valid: false,
        reason: 'OTP_MISMATCH',
      };
    }

    return { valid: true };
  }

  /**
   * Check if OTP is expired
   */
  static isOTPExpired(otpExpiry: Date | null | undefined): boolean {
    if (!otpExpiry) return true;
    return new Date() > otpExpiry;
  }

  /**
   * Increment OTP attempts
   */
  static incrementOTPAttempts(currentAttempts: number): number {
    return currentAttempts + 1;
  }

  /**
   * Check if max OTP attempts exceeded
   */
  static isMaxAttemptsExceeded(attempts: number, maxAttempts: number = 5): boolean {
    return attempts >= maxAttempts;
  }

  /**
   * Reset OTP data
   */
  static createOTPData(otp: string, expiryMinutes: number = 10) {
    return {
      otp,
      otpExpiry: this.getOTPExpiry(expiryMinutes),
      otpAttempts: 0,
    };
  }
}

export default OTPService;
