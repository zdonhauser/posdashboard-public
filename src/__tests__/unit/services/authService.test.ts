/**
 * Unit tests for Auth Service
 */

import * as authService from "../../../services/authService";
import { queryDB } from "../../../config/database";

// Mock database
jest.mock("../../../config/database");
const mockQueryDB = queryDB as jest.MockedFunction<typeof queryDB>;

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("isDeviceApproved", () => {
    it("should return true if device is approved", async () => {
      mockQueryDB.mockResolvedValue({
        rows: [{ device_id: "device-123" }],
        command: "SELECT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await authService.isDeviceApproved("device-123");

      expect(mockQueryDB).toHaveBeenCalledWith(
        "SELECT device_id FROM approved_devices WHERE device_id = $1",
        ["device-123"]
      );
      expect(result).toBe(true);
    });

    it("should return false if device is not approved", async () => {
      mockQueryDB.mockResolvedValue({
        rows: [],
        command: "SELECT",
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await authService.isDeviceApproved("device-456");

      expect(mockQueryDB).toHaveBeenCalledWith(
        "SELECT device_id FROM approved_devices WHERE device_id = $1",
        ["device-456"]
      );
      expect(result).toBe(false);
    });

    it("should handle database errors", async () => {
      mockQueryDB.mockRejectedValue(new Error("Database connection failed"));

      await expect(authService.isDeviceApproved("device-789")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("approveDevice", () => {
    it("should approve a new device", async () => {
      mockQueryDB.mockResolvedValue({
        rows: [],
        command: "INSERT",
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await authService.approveDevice("device-new");

      expect(mockQueryDB).toHaveBeenCalledWith(
        "INSERT INTO approved_devices (device_id) VALUES ($1) ON CONFLICT DO NOTHING",
        ["device-new"]
      );
      expect(result).toBe(true);
    });

    it("should handle already approved device (conflict)", async () => {
      mockQueryDB.mockResolvedValue({
        rows: [],
        command: "INSERT",
        rowCount: 0, // ON CONFLICT DO NOTHING results in 0 rows affected
        oid: 0,
        fields: [],
      });

      const result = await authService.approveDevice("device-existing");

      expect(result).toBe(true);
    });

    it("should return false on database error", async () => {
      mockQueryDB.mockRejectedValue(new Error("Database error"));

      const result = await authService.approveDevice("device-error");

      expect(console.error).toHaveBeenCalledWith(
        "Error approving device:",
        expect.any(Error)
      );
      expect(result).toBe(false);
    });
  });
});
