/**
 * Authentication Service
 * Handles business logic for device validation and passcode verification
 */

import { queryDB } from "@config/database";

/**
 * Check if a device ID is approved
 *
 * @param deviceId Device ID to validate
 * @returns True if device is approved, false otherwise
 */
export async function isDeviceApproved(deviceId: string): Promise<boolean> {
  const result = await queryDB(
    "SELECT device_id FROM approved_devices WHERE device_id = $1",
    [deviceId]
  );

  return result.rows.length > 0;
}

/**
 * Approve a device by adding it to the approved_devices table
 *
 * @param deviceId Device ID to approve
 * @returns True if device was approved (or already approved), false on error
 */
export async function approveDevice(deviceId: string): Promise<boolean> {
  try {
    await queryDB(
      "INSERT INTO approved_devices (device_id) VALUES ($1) ON CONFLICT DO NOTHING",
      [deviceId]
    );
    return true;
  } catch (error) {
    console.error("Error approving device:", error);
    return false;
  }
}
