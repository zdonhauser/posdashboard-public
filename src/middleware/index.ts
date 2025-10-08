/**
 * Middleware Barrel Export
 *
 * Exports all middleware modules for easy importing
 */

// Authentication middleware
export {
  getClientIp,
  validateDevice,
  verifyPasscode,
  requireAuth,
  optionalAuth,
} from './auth';

// Error handling middleware
export {
  AppError,
  createErrorResponse,
  logError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  sendSuccess,
  sendError,
} from './errorHandler';

// Validation middleware
export {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeString,
  sanitizeBody,
  requireFields,
  commonRules,
  ValidationRule,
  ValidationResult,
} from './validation';
