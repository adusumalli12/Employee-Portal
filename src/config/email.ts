import dns from 'dns';
// Force IPv4 for all network connections (Fixes ENETUNREACH on platforms like Render)
dns.setDefaultResultOrder('ipv4first');

import nodemailer, { Transporter } from 'nodemailer';
import env from './environment';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

interface SendEmailResult {
  messageId: string;
  response: string;
}

let transporter: Transporter | null = null;

export function getEmailTransporter(): Transporter {
  if (!transporter) {
    const emailConfig: any = {
      service: 'gmail',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 60000,
      family: 4, // Force IPv4
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    };

    transporter = nodemailer.createTransport(emailConfig);

    // Verify email configuration on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error('[Email] Configuration Error:', error.message);
      } else {
        console.log('[Email] Server is ready to send emails');
      }
    });
  }

  return transporter;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = getEmailTransporter();

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    });

    return {
      messageId: info.messageId || '',
      response: info.response || 'Email sent successfully',
    };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw error;
  }
}

export default {
  getEmailTransporter,
  sendEmail,
};
