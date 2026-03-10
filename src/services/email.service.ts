import env from '../config/environment';
import { sendEmail } from '../config/email';
import * as emailTemplates from './emailTemplates';

interface SendEmailResult {
  success: boolean;
  message: string;
}

class EmailService {
  /**
   * Send verification email
   */
  static async sendVerificationEmail(
    email: string,
    name: string,
    verificationLink: string
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.verificationEmail(name, verificationLink);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Verification email sent to ${email}`);
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Error sending verification email:', error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    name: string,
    resetLink: string
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.passwordResetEmail(name, resetLink);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Password reset email sent to ${email}`);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Error sending password reset email:', error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.welcomeEmail(name);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Welcome email sent to ${email}`);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Error sending welcome email:', error.message);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Send password changed confirmation email
   */
  static async sendPasswordChangedEmail(
    email: string,
    name: string
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.passwordChangedEmail(name);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Password changed email sent to ${email}`);
      return { success: true, message: 'Password changed confirmation sent' };
    } catch (error: any) {
      console.error('[Email] Error sending password changed email:', error.message);
      throw new Error(`Failed to send password changed email: ${error.message}`);
    }
  }

  /**
   * Send OTP email
   */
  static async sendOTPEmail(
    email: string,
    name: string,
    otp: string,
    context: 'signup' | 'forgot-password' | 'email-verification' | 'password-change' = 'signup',
    expiryMinutes: number = 10
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.otpEmail(name, otp, context, expiryMinutes);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] OTP email sent to ${email} for context: ${context}`);
      return { success: true, message: 'OTP email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Error sending OTP email:', error.message);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  /**
   * Send manager approval pending email
   */
  static async sendManagerApprovalEmail(email: string, name: string): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.managerApprovalEmail(name);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Manager approval pending email sent to ${email}`);
      return { success: true, message: 'Approval pending email sent' };
    } catch (error: any) {
      console.error('[Email] Error sending manager approval email:', error.message);
      throw new Error(`Failed to send approval email: ${error.message}`);
    }
  }
}

export default EmailService;
