import env from '../config/environment';

// User Roles
export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

// OTP Methods
export enum OtpMethod {
  EMAIL = 'email',
  SMS = 'sms',
}

// OTP Contexts
export enum OtpContext {
  SIGNUP = 'signup',
  FORGOT_PASSWORD = 'forgot-password',
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_CHANGE = 'password-change',
}

// Verification Methods
export enum VerificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both',
}

// Response Messages
export const ResponseMessages = {
  // Auth Messages
  SIGNUP_SUCCESS: 'Signup successful. Please verify your email.',
  SIGNUP_FAILED: 'Signup failed. Please try again.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGIN_FAILED: 'Invalid email or password.',
  LOGOUT_SUCCESS: 'Logout successful.',
  LOGOUT_FAILED: 'Logout failed.',

  // Email Verification
  EMAIL_VERIFIED: 'Email verified successfully.',
  EMAIL_VERIFICATION_TOKEN_SENT: 'Email verification token sent.',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'Email verification token has expired.',
  EMAIL_VERIFICATION_FAILED: 'Email verification failed.',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified.',

  // OTP Messages
  OTP_SENT: 'OTP sent successfully.',
  OTP_VERIFIED: 'OTP verified successfully.',
  OTP_VERIFICATION_FAILED: 'OTP verification failed.',
  OTP_EXPIRED: 'OTP has expired.',
  OTP_NOT_FOUND: 'OTP not found.',
  INVALID_OTP: 'Invalid OTP.',
  OTP_MAX_ATTEMPTS_EXCEEDED: 'Maximum OTP attempts exceeded.',

  // Password Messages
  PASSWORD_RESET_LINK_SENT: 'Password reset link sent to email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully.',
  PASSWORD_RESET_FAILED: 'Password reset failed.',
  PASSWORD_RESET_TOKEN_EXPIRED: 'Password reset token has expired.',
  PASSWORD_UPDATE_SUCCESS: 'Password updated successfully.',

  // User Messages
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'User already exists.',
  USER_FETCH_SUCCESS: 'User fetched successfully.',
  USER_UPDATE_SUCCESS: 'User updated successfully.',
  USER_DELETE_SUCCESS: 'User deleted successfully.',

  // Error Messages
  INTERNAL_SERVER_ERROR: 'Internal server error.',
  INVALID_REQUEST: 'Invalid request.',
  UNAUTHORIZED: 'Unauthorized.',
  FORBIDDEN: 'Forbidden.',
  NOT_FOUND: 'Not found.',
  BAD_REQUEST: 'Bad request.',
  CONFLICT: 'Conflict.',
  VALIDATION_ERROR: 'Validation error.',
  AUTHENTICATION_REQUIRED: 'Authentication required.',

  // Twilio Messages
  SMS_SENT: 'SMS sent successfully.',
  SMS_SEND_FAILED: 'Failed to send SMS.',

  // Email Messages
  EMAIL_SEND_FAILED: 'Failed to send email.',
  EMAIL_ALREADY_IN_USE: 'Email already in use.',

  // Selection Messages
  VERIFICATION_METHOD_SELECTED: 'Verification method selected.',
};

// Error Codes
export const ErrorCodes = {
  // Auth Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_PHONE: 'INVALID_PHONE',

  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',

  // OTP Errors
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',

  // Server Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

// Token Expiry Times
export const TOKEN_EXPIRY = {
  JWT: '7d',
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour in milliseconds
  OTP: 10 * 60 * 1000, // 10 minutes in milliseconds
  OTP_SIGNUP: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// Rate Limiting
export const RATE_LIMITS = {
  WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
  MAX_GLOBAL: env.RATE_LIMIT_MAX_GLOBAL,
  MAX_AUTH: env.RATE_LIMIT_MAX_AUTH,
  MAX_OTP: env.RATE_LIMIT_MAX_OTP,
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, // Min 8 chars, upper, lower, digit, special
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w \.-]*)*\/?$/,
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export default {
  UserRole,
  OtpMethod,
  OtpContext,
  VerificationMethod,
  ResponseMessages,
  ErrorCodes,
  TOKEN_EXPIRY,
  RATE_LIMITS,
  REGEX_PATTERNS,
  HTTP_STATUS,
};
