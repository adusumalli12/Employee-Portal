import { REGEX_PATTERNS } from './constants';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
    });
  } else if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  } else if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  } else if (!/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one digit',
    });
  } else if (!/[@$!%*?&]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character (@$!%*?&)',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePhoneNumber(phone: string): boolean {
  return REGEX_PATTERNS.PHONE.test(phone);
}

export function validateSignupData(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }

  if (!data.company || typeof data.company !== 'string' || !data.company.trim()) {
    errors.push({ field: 'company', message: 'Company is required' });
  }

  if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (!data.position || typeof data.position !== 'string' || !data.position.trim()) {
    errors.push({ field: 'position', message: 'Position is required' });
  }

  if (typeof data.salary !== 'number' || data.salary < 0) {
    errors.push({ field: 'salary', message: 'Valid salary is required' });
  }

  if (typeof data.experience !== 'number' || data.experience < 0) {
    errors.push({ field: 'experience', message: 'Valid experience is required' });
  }

  if (data.phoneNumber && !validatePhoneNumber(data.phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Valid phone number is required' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLoginData(data: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp); // 6-digit OTP
}

export default {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateSignupData,
  validateLoginData,
  validateOTP,
};
