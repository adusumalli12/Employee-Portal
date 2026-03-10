export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  token?: string;
  user?: any;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  company: string;
  location: string;
  position: string;
  salary: number;
  experience: number;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  location?: string;
  position?: string;
  salary?: number;
  experience?: number;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  phoneNumberVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OTPRequest {
  email: string;
  otp: string;
  context: string;
}

export interface VerificationMethodRequest {
  email: string;
  verificationMethod: 'email' | 'sms' | 'both';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email?: string;
  newPassword: string;
  otp: string;
  token?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  company?: string;
  location?: string;
  position?: string;
  salary?: number;
  experience?: number;
  phoneNumber?: string;
}

export interface ApiError {
  status: number;
  message: string;
  data?: any;
}
