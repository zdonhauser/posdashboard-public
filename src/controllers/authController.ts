/**
 * Authentication Controller
 * Handles HTTP requests for device validation and passcode verification
 */

import { Request, Response } from "express";
import * as authService from "../services/authService";

/**
 * Validate if a device is approved
 * Simple endpoint to check device approval status without side effects
 */
export async function validateDevice(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      res.status(400).json({ error: "Device ID is required" });
      return;
    }

    const approved = await authService.isDeviceApproved(deviceId);
    res.json({ approved });
  } catch (error) {
    console.error("Error validating device:", error);
    res.status(500).json({ error: "Server error during device validation" });
  }
}
