export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin' | 'superadmin';
  company?: string;
  position?: string;
  location?: string;
  salary?: number;
  experience?: number;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  phoneNumberVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  location: string;
  position: string;
  salary: number;
  experience: number;
  phoneNumber?: string;
}
