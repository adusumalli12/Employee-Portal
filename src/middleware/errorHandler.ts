import { Request, Response, NextFunction } from 'express';
import env from '../config/environment';
import { HTTP_STATUS } from '../utils/constants';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

/**
 * Centralized Error Handler Middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);

  const status = (err as ApiError).status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    err.message || 'An unexpected error occurred. Please try again later.';
  const code = (err as ApiError).code || 'INTERNAL_SERVER_ERROR';

  // Build response
  const response: any = {
    success: false,
    message,
    code,
  };

  // Include error details in development
  if (env.NODE_ENV === 'development') {
    response.error = err instanceof Error ? err.stack : err;
  }

  res.status(status).json(response);
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
}

/**
 * Async Route Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create Custom Error
 */
export function createError(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
};
