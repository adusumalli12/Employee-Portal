import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { Employee } from '../models/employee.model';
import {
  generateToken,
  generatePasswordResetToken,
  generateEmailVerificationToken
} from '../utils/token-generator';
import OTPService from '../services/otp.service';
import EmailService from '../services/email.service';
import env from '../config/environment';
import { HTTP_STATUS, ResponseMessages } from '../utils/constants';
import { Notification } from '../models/notification.model';
import { emitNotification } from '../utils/socket';

/**
 * Auth Controller
 * Rebuilt to restore full functionality
 */

// Public endpoints
export async function signup(req: AuthRequest, res: Response): Promise<void> {
  const {
    name,
    email,
    password,
    company,
    location,
    position,
    salary,
    experience,
    phoneNumber,
    role,
  } = req.body;

  // 1. Basic validation
  if (!name || !email || !password || !company || !location || !position || salary === undefined || experience === undefined) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'All fields are required',
    });
    return;
  }

  // 2. Check if user already exists
  const existingUser = await Employee.findOne({ email });
  if (existingUser) {
    res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: ResponseMessages.USER_ALREADY_EXISTS,
    });
    return;
  }

  // 3. Create new employee
  const isInitialAdmin = email.toLowerCase() === env.INITIAL_ADMIN_EMAIL.toLowerCase();
  const assignedRole = isInitialAdmin ? 'superadmin' : (role || 'user');
  const needsApproval = assignedRole === 'manager';

  const employee = new Employee({
    name,
    email,
    password,
    company,
    location,
    position,
    salary,
    experience,
    phoneNumber,
    role: assignedRole,
    isApproved: !needsApproval, // Managers need approval, others (including superadmin) don't
  });

  // 4. Generate verification token
  const verificationToken = generateEmailVerificationToken(email);
  employee.emailVerificationToken = verificationToken;
  employee.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await employee.save();

  // 5. Send verification email in background (POINTING TO FRONTEND)
  const verificationLink = `${env.FRONTEND_URL}/#/verify-email?token=${verificationToken}`;
  console.log('------------------------------------------------');
  console.log('DEBUG - Signup Verification Link being sent:', verificationLink);
  console.log('------------------------------------------------');

  EmailService.sendVerificationEmail(email, name, verificationLink)
    .catch(emailError => console.error('[Signup] Background email error:', emailError));

    // Notifications are defered until email verification

  // 6. Return response (excluding password)
  const userData = employee.toObject();
  delete (userData as any).password;
  delete (userData as any).emailVerificationToken;

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: ResponseMessages.SIGNUP_SUCCESS,
    user: userData,
  });
}



export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body;

  // 1. Validation
  if (!email || !password) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  // 2. Find user
  const employee = await Employee.findOne({ email });
  if (!employee) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ResponseMessages.LOGIN_FAILED,
    });
    return;
  }

  // 3. Compare password
  const isMatch = await employee.comparePassword(password);
  if (!isMatch) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ResponseMessages.LOGIN_FAILED,
    });
    return;
  }

  // 4. Check if verified
  if (!employee.isEmailVerified) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Email not verified. Please check your inbox.',
    });
    return;
  }

  // 5. Check if approved (Super Admin is always approved)
  if (!employee.isApproved && employee.role !== 'superadmin') {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Your account is pending administrative approval. You will receive an email once verified.',
    });
    return;
  }

  // 6. Generate token
  const token = generateToken({
    id: employee._id.toString(),
    email: employee.email,
    role: employee.role,
  });

  // 6. Return response
  const userData = employee.toObject();
  delete (userData as any).password;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: ResponseMessages.LOGIN_SUCCESS,
    user: userData,
    token,
  });
}

export async function verifyEmail(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.params;

  if (!token) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Verification token is required',
    });
    return;
  }

  // Find user by token
  const employee = await Employee.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: new Date() },
  });

  if (!employee) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ResponseMessages.EMAIL_VERIFICATION_TOKEN_EXPIRED,
    });
    return;
  }

  employee.isEmailVerified = true;
  employee.emailVerificationToken = null;
  employee.emailVerificationExpiry = null;
  await employee.save();

  // 5. Check if approved (Super Admin is always approved)
  if (!employee.isApproved && employee.role !== 'superadmin') {
    // Notify Manager via Email
    EmailService.sendManagerApprovalEmail(employee.email, employee.name)
        .catch(err => console.error('Error sending manager approval email:', err));

    // Notify SuperAdmins about verified manager needing approval
    (async () => {
      try {
        const administrators = await Employee.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
        for (const admin of administrators) {
          const notification = await Notification.create({
            recipient: admin._id,
            sender: employee._id,
            title: 'New Manager Registry',
            message: `${employee.name} has verified their email and requires administrative approval for their ${employee.location} office role.`,
            type: 'user_registered',
            relatedId: employee._id
          });
          
          // Emit real-time socket notification
          emitNotification(admin._id.toString(), notification);
        }
      } catch (err) {
        console.error('Error notifying admins about verified manager signup:', err);
      }
    })();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email verified successfully. Your account is now pending administrative approval.',
      isApproved: false
    });
    return;
  } else {
    // Notify team about new approved user (like a standard User)
    (async () => {
      try {
        const recipients = await Employee.find({ role: { $in: ['manager', 'admin', 'superadmin'] } }).select('_id');
        for (const recipient of recipients) {
          if (recipient._id.toString() === employee._id.toString()) continue;
          await Notification.create({
            recipient: recipient._id,
            sender: employee._id,
            title: 'Personnel Database Update',
            message: `A new employee, ${employee.name}, has verified their account and joined the ${employee.location} team as ${employee.position}.`,
            type: 'user_registered',
            relatedId: employee._id
          });
        }
      } catch (err) {
        console.error('Error notifying team about verified signup:', err);
      }
    })();
  }

  // 6. Generate token for auto-login after verification
  const tokenForLogin = generateToken({
    id: employee._id.toString(),
    email: employee.email,
    role: employee.role,
  });

  const userData = employee.toObject();
  delete (userData as any).password;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: ResponseMessages.EMAIL_VERIFIED,
    user: userData,
    token: tokenForLogin,
    role: employee.role
  });
}

export async function resendVerification(req: AuthRequest, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const employee = await Employee.findOne({ email });
  if (!employee) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ResponseMessages.USER_NOT_FOUND,
    });
    return;
  }

  if (employee.isEmailVerified) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ResponseMessages.EMAIL_ALREADY_VERIFIED,
    });
    return;
  }

  // Generate new token
  const verificationToken = generateEmailVerificationToken(email);
  employee.emailVerificationToken = verificationToken;
  employee.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await employee.save();

  // Send email in background (POINTING TO FRONTEND)
  const verificationLink = `${env.FRONTEND_URL}/#/verify-email?token=${verificationToken}`;

  console.log('------------------------------------------------');
  console.log('DEBUG - Resend Link being sent:', verificationLink);
  console.log('------------------------------------------------');

  EmailService.sendVerificationEmail(email, employee.name, verificationLink)
    .catch(emailError => console.error('[Resend] Background email error:', emailError));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: ResponseMessages.EMAIL_VERIFICATION_TOKEN_SENT,
  });
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ResponseMessages.UNAUTHORIZED,
    });
    return;
  }

  const employee = await Employee.findById(req.user.id);
  if (!employee) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ResponseMessages.USER_NOT_FOUND,
    });
    return;
  }

  const userData = employee.toObject();
  delete (userData as any).password;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: ResponseMessages.USER_FETCH_SUCCESS,
    user: userData,
  });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { name, company, location, position, phoneNumber } = req.body;

  try {
    const employee = await Employee.findByIdAndUpdate(
      req.user.id,
      { $set: { name, company, location, position, phoneNumber } },
      { new: true, runValidators: true }
    );

    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'User not found' });
      return;
    }

    const userData = employee.toObject();
    delete (userData as any).password;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      user: userData,
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { currentPassword, newPassword, otp } = req.body;

  if (!newPassword) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'New password is required',
    });
    return;
  }

  try {
    const employee = await Employee.findById(req.user.id).select('+otp +password');
    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'User not found' });
      return;
    }

    if (otp) {
      // Verification via OTP
      const verification = OTPService.verifyOTP(otp, employee.otp, employee.otpExpiry);
      if (!verification.valid) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: verification.reason === 'OTP_EXPIRED' ? 'OTP has expired' : 'Invalid OTP code',
        });
        return;
      }
      // Success - clear OTP
      employee.otp = null;
      employee.otpExpiry = null;
    } else if (currentPassword) {
      // Verification via Current Password
      const isMatch = await employee.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Incorrect current password',
        });
        return;
      }
    } else {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Verification required (Current Password or OTP)',
      });
      return;
    }

    employee.password = newPassword;
    await employee.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}

export async function selectVerificationMethod(req: AuthRequest, res: Response): Promise<void> {
  const { email, verificationMethod } = req.body;

  if (!email || !verificationMethod) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email and verification method are required',
    });
    return;
  }

  const employee = await Employee.findOne({ email });
  if (!employee) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ResponseMessages.USER_NOT_FOUND,
    });
    return;
  }

  try {
    const otp = OTPService.generateOTP();
    const otpData = OTPService.createOTPData(otp);

    employee.otp = otp;
    employee.otpExpiry = otpData.otpExpiry;
    employee.otpAttempts = otpData.otpAttempts;
    employee.otpMethod = verificationMethod as 'email' | 'sms';
    employee.otpContext = 'email-verification';
    await employee.save();

    if (verificationMethod === 'email') {
      OTPService.sendOTPViaEmail(email, employee.name, otp, 'email-verification')
        .catch(err => console.error('[SelectMethod] Background email error:', err.message));
    } else if (verificationMethod === 'sms') {
      if (!employee.phoneNumber) {
        throw new Error('Phone number not found for this user');
      }
      OTPService.sendOTPViaSMS(employee.phoneNumber, otp, 'email-verification')
        .catch(err => console.error('[SelectMethod] Background SMS error:', err.message));
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `OTP sent to your ${verificationMethod}`,
      context: 'email-verification',
    });
  } catch (error: any) {
    console.error('[SelectMethod] Error:', error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
}

export async function requestPasswordChangeOTP(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'User not found' });
      return;
    }

    const otp = OTPService.generateOTP();
    const otpData = OTPService.createOTPData(otp);

    employee.otp = otp;
    employee.otpExpiry = otpData.otpExpiry;
    employee.otpAttempts = otpData.otpAttempts;
    employee.otpMethod = 'email';
    employee.otpContext = 'password-change';
    await employee.save();

    OTPService.sendOTPViaEmail(employee.email, employee.name, otp, 'password-change')
      .catch(err => console.error('[RequestOTP] Background email error:', err.message));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Verification code sent to your email',
      context: 'password-change',
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}

export async function verifyOTP(req: AuthRequest, res: Response): Promise<void> {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email and OTP are required',
    });
    return;
  }

  const employee = await Employee.findOne({ email }).select('+otp');
  if (!employee) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: ResponseMessages.USER_NOT_FOUND,
    });
    return;
  }

  const verification = OTPService.verifyOTP(otp, employee.otp, employee.otpExpiry);

  if (!verification.valid) {
    employee.otpAttempts = (employee.otpAttempts || 0) + 1;
    await employee.save();

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: verification.reason === 'OTP_EXPIRED' ? 'OTP has expired' : 'Invalid OTP code',
    });
    return;
  }

  // Success
  if (employee.otpMethod === 'email') {
    employee.isEmailVerified = true;
  } else if (employee.otpMethod === 'sms') {
    employee.phoneNumberVerified = true;
  }

  employee.otpAttempts = 0;
  await employee.save();

  // Check if approved
  if (!employee.isApproved && employee.role !== 'superadmin') {
    // Notify SuperAdmins about verified manager needing approval
    (async () => {
      try {
        const administrators = await Employee.find({ role: { $in: ['admin', 'superadmin'] } }).select('_id');
        for (const admin of administrators) {
          const notification = await Notification.create({
            recipient: admin._id,
            sender: employee._id,
            title: 'New Manager Registry',
            message: `${employee.name} has verified their identity via OTP and requires administrative approval for their ${employee.location} office role.`,
            type: 'user_registered',
            relatedId: employee._id
          });
          
          // Emit real-time socket notification
          emitNotification(admin._id.toString(), notification);
        }
      } catch (err) {
        console.error('Error notifying admins about OTP-verified manager:', err);
      }
    })();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'OTP verified. Your account is pending administrative approval.',
      isApproved: false
    });
    return;
  }

  // Generate token for auto-login
  const token = generateToken({
    id: employee._id.toString(),
    email: employee.email,
    role: employee.role,
  });

  const userData = employee.toObject();
  delete (userData as any).password;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'OTP verified successfully',
    token,
    user: userData,
  });
}

export async function forgotPassword(req: AuthRequest, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const employee = await Employee.findOne({ email });
  if (!employee) {
    // Return success even if user not found for security
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
    return;
  }

  const otp = OTPService.generateOTP();
  const otpData = OTPService.createOTPData(otp, 60); // 1 hour expiry

  employee.otp = otp;
  employee.otpExpiry = otpData.otpExpiry;
  employee.otpContext = 'forgot-password';
  await employee.save();

  console.log('------------------------------------------------');
  console.log('DEBUG - Forgot Password OTP being sent:', otp);
  console.log('------------------------------------------------');

  OTPService.sendOTPViaEmail(email, employee.name, otp, 'forgot-password', 60)
    .catch(error => console.error('[ForgotPassword] Background email error:', error));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Verification code sent to your email',
  });
}

export async function resetPassword(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.params;
  const { newPassword, email, otp } = req.body;

  if (!newPassword) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'New password is required',
    });
    return;
  }

  let employee;

  // 1. Try Token-based reset (Legacy/Link)
  if (token) {
    employee = await Employee.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    });
  }
  // 2. Try OTP-based reset (New Flow)
  else if (email && otp) {
    employee = await Employee.findOne({ email }).select('+otp +otpExpiry');
    if (employee) {
      const verification = OTPService.verifyOTP(otp, employee.otp, employee.otpExpiry);
      if (!verification.valid) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: verification.reason === 'OTP_EXPIRED' ? 'OTP has expired' : 'Invalid OTP code',
        });
        return;
      }
    }
  } else {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Authentication token or Email/OTP is required',
    });
    return;
  }

  if (!employee) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid or expired reset credentials',
    });
    return;
  }

  // 3. Update password and clear ALL reset fields
  employee.password = newPassword;
  employee.passwordResetToken = null;
  employee.passwordResetExpiry = null;
  employee.otp = null;
  employee.otpExpiry = null;
  employee.otpContext = null;

  await employee.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password has been reset successfully. You can now login.',
  });
}

export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    const employee = await Employee.findByIdAndDelete(req.user.id);
    if (!employee) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  // Clear cookie if exists
  res.clearCookie('token');
  res.json({ success: true, message: ResponseMessages.LOGOUT_SUCCESS });
}

export default {
  signup,
  login,
  verifyEmail,
  resendVerification,
  selectVerificationMethod,
  verifyOTP,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  requestPasswordChangeOTP,
};
