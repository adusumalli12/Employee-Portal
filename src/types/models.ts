import { Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  // Basic Information
  name: string;
  email: string;
  password: string;
  company: string;
  location: string;
  position: string;
  salary: number;
  experience: number;
  phoneNumber?: string;
  isApproved: boolean;

  // Email Verification
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiry?: Date | null;

  // Password Reset
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;

  // OTP Verification
  otpMethod?: 'email' | 'sms' | null;
  otp?: string | null;
  otpExpiry?: Date | null;
  otpAttempts: number;
  otpContext?: 'signup' | 'forgot-password' | 'email-verification' | 'password-change' | null;

  // Phone Number Verification
  phoneNumberVerified: boolean;

  // User Role
  role: 'user' | 'manager' | 'admin' | 'superadmin';
  managerId?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IEmployeeModel extends Model<IEmployee> {
  // Add static methods here if needed
  findByEmail(email: string): Promise<IEmployee | null>;
}

export interface EmployeeInput {
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

export interface IAttendance extends Document {
  employee: any;
  checkIn: Date;
  checkOut?: Date;
  status: 'working' | 'completed' | 'on-break';
  totalSeconds?: number;
  date: string; // YYYY-MM-DD
}

export interface IAttendanceModel extends Model<IAttendance> { }
