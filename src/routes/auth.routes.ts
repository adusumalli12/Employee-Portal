import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import * as authController from '../controllers/auth.controller';
import { RATE_LIMITS } from '../utils/constants';

const router = Router();

// ===========================
// Rate Limiters
// ===========================

const signupLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many signup attempts.',
  },
  skip: (req) => req.method !== 'POST',
});

const verifyEmailLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts.',
  },
});

const resendVerificationLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many resend attempts.',
  },
});

const loginLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts.',
  },
});

const otpLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_OTP,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP attempts.',
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_OTP,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts.',
  },
});

// ===========================
// Public Routes
// ===========================

// Signup
router.post('/signup', signupLimiter, asyncHandler(authController.signup));

// Login
router.post('/login', loginLimiter, asyncHandler(authController.login));

// Verify Email via Link
router.get('/verify-email/:token', verifyEmailLimiter, asyncHandler(authController.verifyEmail));

// Resend Email Verification
router.post('/resend-verification', resendVerificationLimiter, asyncHandler(authController.resendVerification));

// Select Verification Method
router.post('/select-verification-method', otpLimiter, asyncHandler(authController.selectVerificationMethod));

// Verify OTP
router.post('/verify-otp', otpLimiter, asyncHandler(authController.verifyOTP));

// Forgot Password
router.post('/forgot-password', passwordResetLimiter, asyncHandler(authController.forgotPassword));

// Reset Password (OTP-based)
router.post('/reset-password', passwordResetLimiter, asyncHandler(authController.resetPassword));

// Reset Password (Token-based/Link)
router.post('/reset-password/:token', passwordResetLimiter, asyncHandler(authController.resetPassword));

// ===========================
// Protected Routes
// ===========================

// Logout
router.post('/logout', authenticateToken, asyncHandler(authController.logout));

// Get Current User
router.get('/me', authenticateToken, asyncHandler(authController.getCurrentUser));
router.get('/current-user', authenticateToken, asyncHandler(authController.getCurrentUser));

// Update Profile
router.put('/update-profile', authenticateToken, asyncHandler(authController.updateProfile));

// Request Password Change OTP
router.post('/request-password-change-otp', authenticateToken, otpLimiter, asyncHandler(authController.requestPasswordChangeOTP));

// Change Password
router.post('/change-password', authenticateToken, passwordResetLimiter, asyncHandler(authController.changePassword));

// Delete Account
router.delete('/delete-account', authenticateToken, asyncHandler(authController.deleteAccount));

export default router;
