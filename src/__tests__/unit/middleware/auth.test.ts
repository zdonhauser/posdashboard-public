/**
 * Authentication Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import {
  getClientIp,
  validateDevice,
  verifyPasscode,
  requireAuth,
  optionalAuth,
} from '../../../middleware/auth';
import * as database from '../../../config/database';
import * as environment from '../../../config/environment';
import * as authUtils from '../../../utils/auth';

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../config/environment');
jest.mock('../../../utils/auth');
jest.mock('bcrypt');

describe('Authentication Middleware', () => {
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
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      mockRequest.headers = { 'x-forwarded-for': '192.168.1.1' };
      const ip = getClientIp(mockRequest as Request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-forwarded-for header (array)', () => {
      mockRequest.headers = { 'x-forwarded-for': ['192.168.1.1', '10.0.0.1'] };
      const ip = getClientIp(mockRequest as Request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from req.ip', () => {
      const testRequest = {
        ...mockRequest,
        headers: {},
        ip: '192.168.1.2',
      };
      const ip = getClientIp(testRequest as Request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from socket.remoteAddress', () => {
      const testRequest = {
        ...mockRequest,
        headers: {},
        ip: undefined,
        socket: { remoteAddress: '192.168.1.3' } as any,
      };
      const ip = getClientIp(testRequest as Request);
      expect(ip).toBe('192.168.1.3');
    });

    it('should return "unknown" if no IP found', () => {
      const testRequest = {
        ...mockRequest,
        headers: {},
        ip: undefined,
        socket: {} as any,
      };
      const ip = getClientIp(testRequest as Request);
      expect(ip).toBe('unknown');
    });
  });

  describe('validateDevice', () => {
    it('should return 400 if deviceId is missing', async () => {
      mockRequest.body = {};

      await validateDevice(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Device ID is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if device is not approved', async () => {
      mockRequest.body = { deviceId: 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

      await validateDevice(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(database.queryDB).toHaveBeenCalledWith(
        'SELECT device_id FROM approved_devices WHERE device_id = $1',
        ['test-device']
      );
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        approved: false,
        error: 'Device not approved',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if device is approved', async () => {
      mockRequest.body = { deviceId: 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({
        rows: [{ device_id: 'test-device' }],
      });

      await validateDevice(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(database.queryDB).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = { deviceId: 'test-device' };
      (database.queryDB as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await validateDevice(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Server error during device validation',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('verifyPasscode', () => {
    beforeEach(() => {
      (environment as any).env = {
        admin: {
          passcodeHash: 'hashed-passcode',
        },
      };
    });

    it('should return 403 if IP is locked out', async () => {
      mockRequest.body = { passcode: '1234', deviceId: 'test-device' };
      (authUtils.handleLockout as jest.Mock).mockReturnValue({
        isLockedOut: true,
        remainingLockout: 5000,
      });

      await verifyPasscode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Too many failed attempts. Try again in 5 second(s).',
      });
    });

    it('should return 401 if passcode is invalid', async () => {
      mockRequest.body = { passcode: 'wrong', deviceId: 'test-device' };
      (authUtils.handleLockout as jest.Mock).mockReturnValue({
        isLockedOut: false,
        remainingLockout: 0,
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      await verifyPasscode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid passcode' });
    });

    it('should approve device and return success if passcode is valid', async () => {
      mockRequest.body = { passcode: 'correct', deviceId: 'test-device' };
      (authUtils.handleLockout as jest.Mock).mockReturnValue({
        isLockedOut: false,
        remainingLockout: 0,
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

      await verifyPasscode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(database.queryDB).toHaveBeenCalledWith(
        'INSERT INTO approved_devices (device_id) VALUES ($1) ON CONFLICT DO NOTHING',
        ['test-device']
      );
      expect(authUtils.resetLockout).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it('should return 500 on database error', async () => {
      mockRequest.body = { passcode: 'correct', deviceId: 'test-device' };
      (authUtils.handleLockout as jest.Mock).mockReturnValue({
        isLockedOut: false,
        remainingLockout: 0,
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (database.queryDB as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await verifyPasscode(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('requireAuth', () => {
    it('should return 401 if no deviceId is provided', async () => {
      mockRequest.headers = {};
      mockRequest.body = {};
      mockRequest.query = {};

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if device is not authorized', async () => {
      mockRequest.headers = { 'x-device-id': 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Device not authorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() and attach deviceId if device is authorized', async () => {
      mockRequest.headers = { 'x-device-id': 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({
        rows: [{ device_id: 'test-device' }],
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(database.queryDB).toHaveBeenCalled();
      expect((mockRequest as any).deviceId).toBe('test-device');
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should check body for deviceId if not in headers', async () => {
      mockRequest.headers = {};
      mockRequest.body = { deviceId: 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({
        rows: [{ device_id: 'test-device' }],
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).deviceId).toBe('test-device');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should check query for deviceId if not in headers or body', async () => {
      mockRequest.headers = {};
      mockRequest.body = {};
      mockRequest.query = { deviceId: 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({
        rows: [{ device_id: 'test-device' }],
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).deviceId).toBe('test-device');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next() even if no deviceId is provided', async () => {
      mockRequest.headers = {};
      mockRequest.body = {};
      mockRequest.query = {};

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should attach deviceId if device is authorized', async () => {
      mockRequest.headers = { 'x-device-id': 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({
        rows: [{ device_id: 'test-device' }],
      });

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).deviceId).toBe('test-device');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not attach deviceId if device is not authorized', async () => {
      mockRequest.headers = { 'x-device-id': 'test-device' };
      (database.queryDB as jest.Mock).mockResolvedValue({ rows: [] });

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect((mockRequest as any).deviceId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() even on database error', async () => {
      mockRequest.headers = { 'x-device-id': 'test-device' };
      (database.queryDB as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
