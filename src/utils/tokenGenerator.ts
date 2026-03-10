import jwt from 'jsonwebtoken';
import env from '../config/environment';
import { TokenPayload } from '../types/express';

export interface TokenOptions {
  expiresIn?: string;
}

export function generateToken(payload: TokenPayload, options?: TokenOptions): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (options?.expiresIn || env.JWT_EXPIRY) as any,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export interface PasswordResetTokenPayload {
  email: string;
  type: 'password-reset';
}

export function generatePasswordResetToken(email: string): string {
  return jwt.sign(
    { email, type: 'password-reset' } as PasswordResetTokenPayload,
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as PasswordResetTokenPayload;
    if (decoded.type !== 'password-reset') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export interface EmailVerificationTokenPayload {
  email: string;
  type: 'email-verification';
}

export function generateEmailVerificationToken(email: string): string {
  return jwt.sign(
    { email, type: 'email-verification' } as EmailVerificationTokenPayload,
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyEmailVerificationToken(token: string): EmailVerificationTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as EmailVerificationTokenPayload;
    if (decoded.type !== 'email-verification') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export default {
  generateToken,
  verifyToken,
  decodeToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
};
