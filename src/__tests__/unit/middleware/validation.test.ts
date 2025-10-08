/**
 * Validation Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateBody,
  validateQuery,
  validateParams,
  sanitizeString,
  sanitizeBody,
  requireFields,
  commonRules,
} from '../../../middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('validateBody', () => {
    it('should pass validation for valid data', () => {
      mockRequest.body = {
        name: 'John Doe',
        age: 30,
      };

      const middleware = validateBody([
        { field: 'name', type: 'string', required: true },
        { field: 'age', type: 'number', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should fail validation for missing required field', () => {
      mockRequest.body = {
        name: 'John Doe',
      };

      const middleware = validateBody([
        { field: 'name', type: 'string', required: true },
        { field: 'age', type: 'number', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining(['age is required']),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation for wrong type', () => {
      mockRequest.body = {
        name: 123,
      };

      const middleware = validateBody([
        { field: 'name', type: 'string', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining(['name must be a string']),
        })
      );
    });

    it('should validate string length', () => {
      mockRequest.body = {
        name: 'Jo',
      };

      const middleware = validateBody([
        { field: 'name', type: 'string', required: true, min: 3, max: 50 },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            'name must be at least 3 characters',
          ]),
        })
      );
    });

    it('should validate number range', () => {
      mockRequest.body = {
        age: 150,
      };

      const middleware = validateBody([
        { field: 'age', type: 'number', required: true, min: 0, max: 120 },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['age must be at most 120']),
        })
      );
    });

    it('should validate email format', () => {
      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validateBody([
        { field: 'email', type: 'email', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            'email must be a valid email address',
          ]),
        })
      );
    });

    it('should validate with custom function', () => {
      mockRequest.body = {
        password: 'weak',
      };

      const middleware = validateBody([
        {
          field: 'password',
          type: 'string',
          required: true,
          custom: (value) => value.length >= 8 || 'Password must be at least 8 characters',
        },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            'Password must be at least 8 characters',
          ]),
        })
      );
    });

    it('should validate array type', () => {
      mockRequest.body = {
        tags: 'not-an-array',
      };

      const middleware = validateBody([
        { field: 'tags', type: 'array', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['tags must be an array']),
        })
      );
    });

    it('should validate array length', () => {
      mockRequest.body = {
        tags: ['tag1'],
      };

      const middleware = validateBody([
        { field: 'tags', type: 'array', required: true, min: 2 },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['tags must have at least 2 items']),
        })
      );
    });

    it('should validate object type', () => {
      mockRequest.body = {
        metadata: 'not-an-object',
      };

      const middleware = validateBody([
        { field: 'metadata', type: 'object', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['metadata must be an object']),
        })
      );
    });

    it('should validate date type', () => {
      mockRequest.body = {
        birthdate: 'invalid-date',
      };

      const middleware = validateBody([
        { field: 'birthdate', type: 'date', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['birthdate must be a valid date']),
        })
      );
    });

    it('should pass validation for optional missing field', () => {
      mockRequest.body = {
        name: 'John Doe',
      };

      const middleware = validateBody([
        { field: 'name', type: 'string', required: true },
        { field: 'email', type: 'email', required: false },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should validate pattern matching', () => {
      mockRequest.body = {
        phone: 'abc123',
      };

      const middleware = validateBody([
        {
          field: 'phone',
          type: 'string',
          required: true,
          pattern: /^\d{10}$/,
        },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining(['phone has invalid format']),
        })
      );
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters', () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      const middleware = validateQuery([
        { field: 'page', type: 'number', required: false },
        { field: 'limit', type: 'number', required: false },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid query params', () => {
      mockRequest.query = {
        limit: 'invalid',
      };

      const middleware = validateQuery([
        { field: 'limit', type: 'number', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Query validation failed',
        })
      );
    });
  });

  describe('validateParams', () => {
    it('should validate route parameters', () => {
      mockRequest.params = {
        id: '123',
      };

      const middleware = validateParams([
        { field: 'id', type: 'number', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation for invalid params', () => {
      mockRequest.params = {
        id: 'abc',
      };

      const middleware = validateParams([
        { field: 'id', type: 'number', required: true },
      ]);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Parameter validation failed',
        })
      );
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = sanitizeString(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should sanitize quotes and apostrophes', () => {
      const input = `"Hello" and 'World'`;
      const output = sanitizeString(input);
      expect(output).toBe('&quot;Hello&quot; and &#x27;World&#x27;');
    });

    it('should return non-string values unchanged', () => {
      expect(sanitizeString(123 as any)).toBe(123);
      expect(sanitizeString(null as any)).toBe(null);
    });
  });

  describe('sanitizeBody', () => {
    it('should sanitize all string values in request body', () => {
      mockRequest.body = {
        name: '<script>alert("XSS")</script>',
        age: 30,
      };

      sanitizeBody(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.name).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(mockRequest.body.age).toBe(30);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      mockRequest.body = {
        user: {
          name: '<script>alert("XSS")</script>',
        },
      };

      sanitizeBody(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.user.name).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      mockRequest.body = {
        tags: ['<script>alert(1)</script>', 'safe-tag'],
      };

      sanitizeBody(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.tags[0]).toBe(
        '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
      );
      expect(mockRequest.body.tags[1]).toBe('safe-tag');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireFields', () => {
    it('should pass if all required fields are present', () => {
      mockRequest.body = {
        name: 'John',
        email: 'john@example.com',
      };

      const middleware = requireFields('name', 'email');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should fail if required fields are missing', () => {
      mockRequest.body = {
        name: 'John',
      };

      const middleware = requireFields('name', 'email');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields',
          details: ['email'],
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail if required fields are empty', () => {
      mockRequest.body = {
        name: '',
        email: null,
      };

      const middleware = requireFields('name', 'email');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Missing required fields',
          details: ['name', 'email'],
        })
      );
    });
  });

  describe('commonRules', () => {
    it('should have id rule', () => {
      const rule = commonRules.id();
      expect(rule.field).toBe('id');
      expect(rule.type).toBe('number');
      expect(rule.required).toBe(true);
      expect(rule.min).toBe(1);
    });

    it('should have email rule', () => {
      const rule = commonRules.email();
      expect(rule.field).toBe('email');
      expect(rule.type).toBe('email');
      expect(rule.required).toBe(true);
    });

    it('should have deviceId rule', () => {
      const rule = commonRules.deviceId();
      expect(rule.field).toBe('deviceId');
      expect(rule.type).toBe('string');
      expect(rule.required).toBe(true);
    });

    it('should have pagination rules', () => {
      expect(commonRules.pagination.page()).toHaveProperty('field', 'page');
      expect(commonRules.pagination.limit()).toHaveProperty('field', 'limit');
      expect(commonRules.pagination.offset()).toHaveProperty('field', 'offset');
    });
  });
});
