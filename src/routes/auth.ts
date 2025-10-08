/**
 * Authentication Routes
 * Defines all authentication and device validation API endpoints
 */

import { Router } from "express";
import * as authController from "../controllers/authController";
import { verifyPasscode } from "../middleware/auth";

const router = Router();

/**
 * @route   POST /api/validate-device
 * @desc    Check if a device ID is approved (read-only check)
 * @access  Public (no JWT required)
 * @body    { deviceId: string }
 */
router.post("/validate-device", authController.validateDevice);

/**
 * @route   POST /api/verify-passcode
 * @desc    Verify admin passcode and approve device
 * @access  Public (no JWT required, but rate-limited)
 * @body    { passcode: string, deviceId: string }
 */
router.post("/verify-passcode", verifyPasscode);

export default router;
