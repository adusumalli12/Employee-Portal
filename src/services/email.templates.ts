export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export const verificationEmail = (name: string, verificationLink: string): EmailTemplate => {
  return {
    subject: `Verify Your Email Address [Ref: ${Math.random().toString(36).substring(7).toUpperCase()}]`,
    text: `Hello ${name},\n\nPlease verify your email by clicking this link:\n${verificationLink}\n\nIf you didn't create an account, ignore this email.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>Or copy this link in your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const passwordResetEmail = (name: string, resetLink: string): EmailTemplate => {
  return {
    subject: `Reset Your Password [Ref: ${Math.random().toString(36).substring(7).toUpperCase()}]`,
    text: `Hello ${name},\n\nYou requested to reset your password. Click this link to reset it:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy this link in your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p style="color: #f44336;"><strong>Note:</strong> This link expires in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const welcomeEmail = (name: string): EmailTemplate => {
  return {
    subject: 'Welcome to Our Platform!',
    text: `Hello ${name},\n\nWelcome! Your account has been successfully created.\n\nYou can now log in and start using our platform.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Our Platform!</h2>
        <p>Hello ${name},</p>
        <p>Your account has been successfully created and verified. You can now log in and start using our platform.</p>
        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Account Status:</strong> Active</p>
        </div>
        <h3>What's Next?</h3>
        <ul>
          <li>Complete your profile</li>
          <li>Explore all available features</li>
          <li>Join our community</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const passwordChangedEmail = (name: string): EmailTemplate => {
  return {
    subject: 'Password Changed Successfully',
    text: `Hello ${name},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please reset your password immediately.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Changed Successfully</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully changed. You can now log in with your new password.</p>
        <p style="color: #f44336;"><strong>Security Alert:</strong> If you didn't authorize this change, please reset your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const otpEmail = (
  name: string,
  otp: string,
  context: string,
  expiryMinutes: number = 10
): EmailTemplate => {
  const contextText =
    context === 'signup'
      ? 'sign up'
      : context === 'forgot-password'
        ? 'reset your password'
        : 'verify your email';

  return {
    subject: `Your OTP for ${contextText.charAt(0).toUpperCase() + contextText.slice(1)}`,
    text: `Hello ${name},\n\nYour OTP (One-Time Password) is: ${otp}\n\nThis OTP will expire in ${expiryMinutes} minutes. Do not share this with anyone.\n\nIf you didn't request this OTP, please ignore this email.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your OTP Code</h2>
        <p>Hello ${name},</p>
        <p>Your OTP (One-Time Password) for ${contextText} is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2196F3;">${otp}</div>
        </div>
        <p style="text-align: center; color: #666;">This OTP will expire in ${expiryMinutes} minutes.</p>
        <p style="color: #f44336;"><strong>Important:</strong> Never share this OTP with anyone. Our support team will never ask for your OTP.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const managerApprovalEmail = (name: string): EmailTemplate => {
  return {
    subject: 'Manager Account Pending Approval',
    text: `Hello ${name},\n\nYour manager account has been verified but is still pending administrative approval.\n\nYou will be notified via email once your account has been approved.\n\nBest regards,\nAuth System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Account Pending Approval</h2>
        <p>Hello ${name},</p>
        <p>Thank you for verifying your email! Your manager account has been successfully created but is currently <strong>pending administrative approval</strong>.</p>
        <div style="background-color: #FFF3E0; border-left: 5px solid #FF9800; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #E65100;"><strong>Status:</strong> Pending Admin Review</p>
        </div>
        <p>Once an administrator reviews and approves your request, you will receive another email and will be able to access the Manager Dashboard.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `,
  };
};

export const leaveRequestedEmail = (managerName: string, employeeName: string, type: string, startDate: string, endDate: string): EmailTemplate => {
    return {
        subject: `New Leave Request: ${employeeName}`,
        text: `Hello ${managerName},\n\n${employeeName} has requested a ${type} leave from ${startDate} to ${endDate}.\n\nPlease log in to the manager dashboard to review this request.\n\nBest regards,\nEmployee Portal`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2c3e50;">New Leave Request</h2>
                <p>Hello <strong>${managerName}</strong>,</p>
                <p><strong>${employeeName}</strong> has submitted a new leave request:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${type}</p>
                    <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
                    <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
                </div>
                <p>Please log in to your dashboard to approve or reject this request.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
        `
    };
};

export const leaveStatusNotificationEmail = (employeeName: string, status: string, leaveType: string, startDate: string, endDate: string): EmailTemplate => {
    const isApproved = status === 'approved';
    const color = isApproved ? '#27ae60' : '#e74c3c';
    
    return {
        subject: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        text: `Hello ${employeeName},\n\nYour ${leaveType} leave request from ${startDate} to ${endDate} has been ${status}.\n\nBest regards,\nEmployee Portal`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Leave Request Update</h2>
                <p>Hello <strong>${employeeName}</strong>,</p>
                <p>Your leave request status has been updated:</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${leaveType}</p>
                    <p style="margin: 5px 0;"><strong>Period:</strong> ${startDate} to ${endDate}</p>
                    <p style="margin: 10px 0; font-size: 18px; color: ${color};"><strong>Status:</strong> ${status.toUpperCase()}</p>
                </div>
                <p>Check your notifications for more details.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
        `
    };
};

export const managerApprovedEmail = (name: string): EmailTemplate => {
    return {
        subject: 'Account Approved - Employee Portal',
        text: `Hello ${name},\n\nYour manager account has been approved by the administrator. You can now login and manage your team.\n\nRegards,\nAdmin Team`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2c3e50;">Account Approved</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your manager account has been successfully <strong>approved</strong> by the administrator.</p>
                <div style="background-color: #E8F5E9; border-left: 5px solid #4CAF50; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #2E7D32;"><strong>Status:</strong> Approved & Active</p>
                </div>
                <p>You can now log in to the Employee Portal and begin managing your team and tasks.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #2c3e50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to Dashboard</a>
                </div>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
            </div>
        `
    };
};

export default {
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
  passwordChangedEmail,
  otpEmail,
  managerApprovalEmail,
  managerApprovedEmail,
  leaveRequestedEmail,
  leaveStatusNotificationEmail,
};
