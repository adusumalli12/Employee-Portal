// Frontend constants
export const ALERT_TYPES = {
  SUCCESS: 'success',
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

export const FORM_VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_MIN_LENGTH: 8,
  OTP_REGEX: /^\d{6}$/,
};

export const PAGES = {
  LOGIN: '#/login',
  SIGNUP: '#/signup',
  DASHBOARD: '#/dashboard',
  MANAGER_DASHBOARD: '#/manager/dashboard',
  ADMIN_DASHBOARD: '#/admin/dashboard',
  ADMIN_APPROVALS: '#/admin/approvals',
  VERIFY_OTP: '#/verify-otp',
  VERIFY_EMAIL: '#/verify-email',
  FORGOT_PASSWORD: '#/forgot-password',
  RESET_PASSWORD: '#/reset-password',
  SELECT_VERIFICATION: '#/select-verification',
  CHANGE_PASSWORD: '#/change-password',
};

export const SESSION_KEYS = {
  SIGNUP_DATA: 'signupData',
  VERIFICATION_CONTEXT: 'verificationContext',
  VERIFICATION_EMAIL: 'verificationEmail',
  RESET_EMAIL: 'resetEmail',
};

export const TIMEOUTS = {
  SHORT: 500,
  MEDIUM: 1500,
  LONG: 2000,
  ALERT_DISPLAY: 3000,
};
