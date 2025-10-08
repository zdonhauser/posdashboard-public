/**
 * Error Handler Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  createErrorResponse,
  logError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  sendSuccess,
  sendError,
} from '../../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      headersSent: false,
    };

    mockNext = jest.fn();

    // Mock console.error to prevent test output clutter
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('AppError', () => {
    it('should create error with default status code 500', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should create error with code and details', () => {
      const error = new AppError(
        'Test error',
        400,
        'VALIDATION_ERROR',
        { field: 'email' }
      );
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('createErrorResponse', () => {
    it('should create basic error response', () => {
      const response = createErrorResponse('Test error');
      expect(response.error).toBe('Test error');
      expect(response.timestamp).toBeDefined();
    });

    it('should include details and code', () => {
      const response = createErrorResponse(
        'Test error',
        { field: 'email' },
        'VALIDATION_ERROR',
        '/api/test'
      );
      expect(response.error).toBe('Test error');
      expect(response.details).toEqual({ field: 'email' });
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.path).toBe('/api/test');
    });
  });

  describe('logError', () => {
    it('should log basic error', () => {
      const error = new Error('Test error');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedOutput = consoleErrorSpy.mock.calls
        .map((call) => call.join(' '))
        .join('\n');
      expect(loggedOutput).toContain('ERROR');
      expect(loggedOutput).toContain('Test error');
    });

    it('should log AppError with additional details', () => {
      const error = new AppError('Test error', 400, 'VALIDATION_ERROR');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedOutput = consoleErrorSpy.mock.calls
        .map((call) => call.join(' '))
        .join('\n');
      expect(loggedOutput).toContain('Status Code: 400');
      expect(loggedOutput).toContain('Error Code: VALIDATION_ERROR');
    });

    it('should log request information when provided', () => {
      const error = new Error('Test error');
      logError(error, mockRequest as Request);

      const loggedOutput = consoleErrorSpy.mock.calls
        .map((call) => call.join(' '))
        .join('\n');
      expect(loggedOutput).toContain('GET');
      expect(loggedOutput).toContain('/api/test');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', 400, 'VALIDATION_ERROR');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should handle database errors', () => {
      const error: any = new Error('Database error');
      error.code = '23505'; // unique_violation

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database error',
          code: '23505',
        })
      );
    });

    it('should handle validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });

    it('should delegate to next if headers already sent', () => {
      const error = new Error('Test error');
      (mockResponse as any).headersSent = true;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should map database error codes correctly', () => {
      const testCases = [
        { code: '23505', expectedStatus: 409 }, // unique_violation
        { code: '23503', expectedStatus: 409 }, // foreign_key_violation
        { code: '23502', expectedStatus: 400 }, // not_null_violation
        { code: '42P01', expectedStatus: 500 }, // undefined_table
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        jest.clearAllMocks();
        const error: any = new Error('Database error');
        error.code = code;

        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        res.json({ success: true });
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward errors to next', async () => {
      const error = new Error('Async error');
      const asyncFn = async () => {
        throw error;
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route information', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Route not found: GET /api/test',
          code: 'NOT_FOUND',
        })
      );
    });
  });

  describe('sendSuccess', () => {
    it('should send success response with default status', () => {
      sendSuccess(mockResponse as Response, { id: 1 });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { id: 1 },
        })
      );
    });

    it('should send success response with custom status and message', () => {
      sendSuccess(
        mockResponse as Response,
        { id: 1 },
        'Created successfully',
        201
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Created successfully',
          data: { id: 1 },
        })
      );
    });
  });

  describe('sendError', () => {
    it('should send error response with default status', () => {
      sendError(mockResponse as Response, 'Test error');

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
        })
      );
    });

    it('should send error response with custom status, details, and code', () => {
      sendError(
        mockResponse as Response,
        'Validation failed',
        400,
        { field: 'email' },
        'VALIDATION_ERROR'
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: { field: 'email' },
          code: 'VALIDATION_ERROR',
        })
      );
    });
  });
});
