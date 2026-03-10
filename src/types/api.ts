export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OtpRequest {
  email: string;
  otp: string;
  context: string;
}

export interface VerificationRequest {
  email: string;
  verificationMethod: 'email' | 'sms' | 'both';
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  otp: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
