/**
 * Request Validation Middleware
 *
 * Provides request body and query parameter validation middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Validation rule interface
 */
interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'date';
  required?: boolean;
  min?: number; // For strings (length) or numbers (value)
  max?: number; // For strings (length) or numbers (value)
  pattern?: RegExp; // For string pattern matching
  custom?: (value: any) => boolean | string; // Custom validation function
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a single value against a rule
 */
function validateValue(value: any, rule: ValidationRule): string | null {
  const { field, type, required, min, max, pattern, custom } = rule;

  // Check if field is required
  if (required && (value === undefined || value === null || value === '')) {
    return `${field} is required`;
  }

  // If not required and value is empty, skip validation
  if (!required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${field} must be a string`;
      }
      if (min !== undefined && value.length < min) {
        return `${field} must be at least ${min} characters`;
      }
      if (max !== undefined && value.length > max) {
        return `${field} must be at most ${max} characters`;
      }
      if (pattern && !pattern.test(value)) {
        return `${field} has invalid format`;
      }
      break;

    case 'number':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field} must be a number`;
      }
      if (min !== undefined && numValue < min) {
        return `${field} must be at least ${min}`;
      }
      if (max !== undefined && numValue > max) {
        return `${field} must be at most ${max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return `${field} must be a boolean`;
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return `${field} must be an array`;
      }
      if (min !== undefined && value.length < min) {
        return `${field} must have at least ${min} items`;
      }
      if (max !== undefined && value.length > max) {
        return `${field} must have at most ${max} items`;
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return `${field} must be an object`;
      }
      break;

    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailPattern.test(value)) {
        return `${field} must be a valid email address`;
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field} must be a valid date`;
      }
      break;

    default:
      return `Unknown validation type for ${field}`;
  }

  // Custom validation
  if (custom) {
    const customResult = custom(value);
    if (customResult === false) {
      return `${field} is invalid`;
    }
    if (typeof customResult === 'string') {
      return customResult;
    }
  }

  return null;
}

/**
 * Validate data against rules
 */
function validate(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const error = validateValue(value, rule);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a validation middleware from rules
 * Validates request body by default, or query/params if specified
 */
export function validateBody(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validate(req.body, rules);

    if (!result.valid) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      });
      return;
    }

    next();
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validate(req.query, rules);

    if (!result.valid) {
      res.status(400).json({
        error: 'Query validation failed',
        details: result.errors,
      });
      return;
    }

    next();
  };
}

/**
 * Validate route parameters
 */
export function validateParams(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validate(req.params, rules);

    if (!result.valid) {
      res.status(400).json({
        error: 'Parameter validation failed',
        details: result.errors,
      });
      return;
    }

    next();
  };
}

/**
 * Common validation rules
 */
export const commonRules = {
  id: (field: string = 'id'): ValidationRule => ({
    field,
    type: 'number',
    required: true,
    min: 1,
  }),

  email: (field: string = 'email', required: boolean = true): ValidationRule => ({
    field,
    type: 'email',
    required,
  }),

  phone: (field: string = 'phone', required: boolean = true): ValidationRule => ({
    field,
    type: 'string',
    required,
    pattern: /^\+?[\d\s\-()]+$/,
  }),

  date: (field: string = 'date', required: boolean = true): ValidationRule => ({
    field,
    type: 'date',
    required,
  }),

  barcode: (field: string = 'barcode', required: boolean = true): ValidationRule => ({
    field,
    type: 'string',
    required,
    min: 1,
    max: 50,
  }),

  deviceId: (required: boolean = true): ValidationRule => ({
    field: 'deviceId',
    type: 'string',
    required,
    min: 1,
  }),

  passcode: (required: boolean = true): ValidationRule => ({
    field: 'passcode',
    type: 'string',
    required,
    min: 1,
  }),

  membershipNumber: (field: string = 'membership_number'): ValidationRule => ({
    field,
    type: 'number',
    required: true,
    min: 1,
  }),

  orderId: (field: string = 'orderId'): ValidationRule => ({
    field,
    type: 'number',
    required: true,
    min: 1,
  }),

  sku: (field: string = 'sku', required: boolean = true): ValidationRule => ({
    field,
    type: 'string',
    required,
    min: 1,
  }),

  amount: (field: string = 'amount', required: boolean = true): ValidationRule => ({
    field,
    type: 'number',
    required,
    min: 0,
  }),

  pagination: {
    page: (): ValidationRule => ({
      field: 'page',
      type: 'number',
      required: false,
      min: 1,
    }),

    limit: (): ValidationRule => ({
      field: 'limit',
      type: 'number',
      required: false,
      min: 1,
      max: 1000,
    }),

    offset: (): ValidationRule => ({
      field: 'offset',
      type: 'number',
      required: false,
      min: 0,
    }),
  },
};

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;

  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize middleware
 * Recursively sanitizes all string values in request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Require specific fields in request body
 * Simple validation for required fields only
 */
export function requireFields(...fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        details: missing,
      });
      return;
    }

    next();
  };
}

/**
 * Export validation utilities
 */
export { ValidationRule, ValidationResult, validate, validateValue };
