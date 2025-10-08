/**
 * Authentication Middleware
 *
 * Provides authentication and device validation middleware for protected routes.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { queryDB } from '../config/database';
import { env } from '../config/environment';
import { handleLockout, resetLockout } from '../utils/auth';

/**
 * Extract client IP address from request
 * Handles various proxy configurations (x-forwarded-for, req.ip, etc.)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromHeader = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (
    ipFromHeader ??
    (typeof req.ip === 'string' ? req.ip : undefined) ??
    req.socket.remoteAddress ??
    'unknown'
  );
}

/**
 * Validate device middleware
 * Checks if a device ID is in the approved_devices table
 */
export async function validateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      res.status(400).json({ error: 'Device ID is required' });
      return;
    }

    const result = await queryDB(
      'SELECT device_id FROM approved_devices WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ approved: false, error: 'Device not approved' });
      return;
    }

    // Device is approved, continue to next middleware
    next();
  } catch (error) {
    console.error('Error validating device:', error);
    res.status(500).json({ error: 'Server error during device validation' });
  }
}

/**
 * Verify passcode and approve device
 * Checks passcode against hash and adds device to approved list
 * Includes rate limiting via handleLockout
 */
export async function verifyPasscode(req: Request, res: Response): Promise<void> {
  try {
    const { passcode, deviceId } = req.body;
    const ip = getClientIp(req);

    // Check if IP is locked out due to failed attempts
    const { isLockedOut, remainingLockout } = handleLockout(ip);

    if (isLockedOut) {
      res.status(403).json({
        error: `Too many failed attempts. Try again in ${Math.ceil(
          remainingLockout / 1000
        )} second(s).`,
      });
      return;
    }

    // Verify passcode
    if (!passcode || !bcrypt.compareSync(passcode, env.admin.passcodeHash)) {
      res.status(401).json({ error: 'Invalid passcode' });
      return;
    }

    // Passcode is valid, approve device
    try {
      await queryDB(
        'INSERT INTO approved_devices (device_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [deviceId]
      );
      resetLockout(ip); // Clear lockout on successful verification
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving device:', error);
      res.status(500).json({ error: 'Server error' });
    }
  } catch (error) {
    console.error('Error in verifyPasscode:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Require authenticated device middleware
 * Used to protect routes that require device authentication
 * Checks if the request includes a valid device ID
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId || req.query.deviceId;

    if (!deviceId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await queryDB(
      'SELECT device_id FROM approved_devices WHERE device_id = $1',
      [deviceId]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Device not authorized' });
      return;
    }

    // Attach device info to request for downstream use
    (req as any).deviceId = deviceId;
    next();
  } catch (error) {
    console.error('Error in requireAuth middleware:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
}

/**
 * Optional auth middleware
 * Similar to requireAuth but doesn't block the request if no auth is present
 * Just attaches device info if available
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId || req.query.deviceId;

    if (deviceId) {
      const result = await queryDB(
        'SELECT device_id FROM approved_devices WHERE device_id = $1',
        [deviceId]
      );

      if (result.rows.length > 0) {
        (req as any).deviceId = deviceId;
      }
    }

    next();
  } catch (error) {
    console.error('Error in optionalAuth middleware:', error);
    // Don't block request on auth errors for optional auth
    next();
  }
}
