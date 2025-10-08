/**
 * Error Handling Middleware
 *
 * Provides standardized error handling and logging for the application.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  details?: any;
  code?: string | number;
  timestamp?: string;
  path?: string;
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  details?: any,
  code?: string | number,
  path?: string
): ErrorResponse {
  return {
    error,
    details,
    code,
    timestamp: new Date().toISOString(),
    path,
  };
}

/**
 * Log error to console with structured format
 */
export function logError(error: Error | AppError, req?: Request): void {
  const timestamp = new Date().toISOString();
  const method = req?.method;
  const path = req?.path;
  const ip = req?.ip || req?.socket?.remoteAddress;

  console.error('='.repeat(80));
  console.error(`[${timestamp}] ERROR`);
  console.error(`Method: ${method} ${path}`);
  console.error(`IP: ${ip}`);
  console.error(`Message: ${error.message}`);

  if (error instanceof AppError) {
    console.error(`Status Code: ${error.statusCode}`);
    console.error(`Error Code: ${error.code}`);
    if (error.details) {
      console.error(`Details:`, error.details);
    }
  }

  console.error(`Stack: ${error.stack}`);
  console.error('='.repeat(80));
}

/**
 * Global error handler middleware
 * Catches all errors and returns standardized error responses
 * Should be registered last in the middleware chain
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError(err, req);

  // If response already sent, delegate to default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      createErrorResponse(err.message, err.details, err.code, req.path)
    );
    return;
  }

  // Handle database errors
  if ((err as any).code) {
    const dbError = err as any;
    const statusCode = getDatabaseErrorStatus(dbError.code);

    res.status(statusCode).json(
      createErrorResponse(
        'Database error',
        dbError.message,
        dbError.code,
        req.path
      )
    );
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json(
      createErrorResponse('Validation error', err.message, 'VALIDATION_ERROR', req.path)
    );
    return;
  }

  // Handle generic errors
  res.status(500).json(
    createErrorResponse('Internal server error', err.message, 'INTERNAL_ERROR', req.path)
  );
}

/**
 * Get HTTP status code from database error code
 */
function getDatabaseErrorStatus(code: string): number {
  const errorMap: Record<string, number> = {
    '23505': 409, // unique_violation
    '23503': 409, // foreign_key_violation
    '23502': 400, // not_null_violation
    '23514': 400, // check_violation
    '22P02': 400, // invalid_text_representation
    '42703': 400, // undefined_column
    '42P01': 500, // undefined_table
    '42883': 500, // undefined_function
  };

  return errorMap[code] || 500;
}

/**
 * Async handler wrapper to catch promise rejections
 * Eliminates need for try-catch in every async route handler
 *
 * Usage:
 *   app.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler middleware
 * Returns 404 for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    createErrorResponse(`Route not found: ${req.method} ${req.path}`, null, 'NOT_FOUND', req.path)
  );
}

/**
 * Standardized success response
 */
export function sendSuccess(
  res: Response,
  data: any,
  message?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standardized error response (for use in route handlers)
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any,
  code?: string
): void {
  res.status(statusCode).json(
    createErrorResponse(error, details, code)
  );
}
