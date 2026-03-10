import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import env from '../config/environment';
import { AuthRequest, TokenPayload } from '../types/express';

/**
 * Authenticate JWT Token Middleware
 * Extracts and verifies JWT token from Authorization header or cookies
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Get token from HTTP-only cookie or Authorization header (for testing)
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required. Please login.',
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded as any;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Invalid token. Access denied.',
    });
  }
}

/**
 * Role-Based Authorization Middleware
 * Checks if user has required role to access the resource
 */
export function authorize(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required. Please login.',
        });
        return;
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error in authorization',
        error: error.message,
      });
    }
  };
}

/**
 * Check Role Middleware
 * Verifies user has role attached to request
 */
export function checkRole(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    if (!req.user || !req.user.role) {
      res.status(403).json({
        success: false,
        message: 'User role not found',
      });
      return;
    }
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error checking user role',
      error: error.message,
    });
  }
}

/**
 * Admin Only Middleware
 * Only allows admin and superadmin roles
 */
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!['admin', 'superadmin'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error in admin authorization',
      error: error.message,
    });
  }
}

/**
 * Superadmin Only Middleware
 * Only allows superadmin role
 */
export function superadminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Superadmin access required',
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error in superadmin authorization',
      error: error.message,
    });
  }
}

export default {
  authenticateToken,
  authorize,
  checkRole,
  adminOnly,
  superadminOnly,
};
