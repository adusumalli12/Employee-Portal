import env from '../config/environment';
import { sendEmail } from '../config/email';
import * as emailTemplates from './email.templates';

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

  /**
   * Send leave request email to manager
   */
  static async sendLeaveRequestedEmail(
    managerEmail: string,
    managerName: string,
    employeeName: string,
    type: string,
    startDate: Date,
    endDate: Date
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.leaveRequestedEmail(
        managerName,
        employeeName,
        type,
        startDate.toDateString(),
        endDate.toDateString()
      );

      await sendEmail({
        to: managerEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, message: 'Leave request email sent to manager' };
    } catch (error: any) {
      console.error('[Email] Error sending leave requested email:', error.message);
      return { success: false, message: 'Failed to send leave request email' };
    }
  }

  /**
   * Send leave status email to employee
   */
  static async sendLeaveStatusEmail(
    employeeEmail: string,
    employeeName: string,
    status: string,
    leaveType: string,
    startDate: Date,
    endDate: Date
  ): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.leaveStatusNotificationEmail(
        employeeName,
        status,
        leaveType,
        startDate.toDateString(),
        endDate.toDateString()
      );

      await sendEmail({
        to: employeeEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, message: 'Leave status email sent to employee' };
    } catch (error: any) {
      console.error('[Email] Error sending leave status email:', error.message);
      return { success: false, message: 'Failed to send leave status email' };
    }
  }

  /**
   * Send manager approval notification
   */
  static async sendManagerApprovedEmail(email: string, name: string): Promise<SendEmailResult> {
    try {
      const template = emailTemplates.managerApprovedEmail(name);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`[Email] Manager approval email sent to ${email}`);
      return { success: true, message: 'Approval email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Error sending manager approval email:', error.message);
      throw new Error(`Failed to send approval email: ${error.message}`);
    }
  }

  /**
   * Generic send email method
   */
  static async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<SendEmailResult> {
    try {
      await sendEmail({
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      console.error('[Email] Generic send error:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

export default EmailService;
