/**
 * Auth Controller Tests
 */

import { Request, Response } from "express";
import * as authController from "../../../controllers/authController";
import * as authService from "../../../services/authService";

// Mock dependencies
jest.mock("../../../services/authService");

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };

    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("validateDevice", () => {
    it("should return approved: true for approved device", async () => {
      mockRequest.body = { deviceId: "device-123" };

      (authService.isDeviceApproved as jest.Mock).mockResolvedValue(true);

      await authController.validateDevice(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(authService.isDeviceApproved).toHaveBeenCalledWith("device-123");
      expect(jsonMock).toHaveBeenCalledWith({ approved: true });
    });

    it("should return approved: false for non-approved device", async () => {
      mockRequest.body = { deviceId: "device-456" };

      (authService.isDeviceApproved as jest.Mock).mockResolvedValue(false);

      await authController.validateDevice(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(authService.isDeviceApproved).toHaveBeenCalledWith("device-456");
      expect(jsonMock).toHaveBeenCalledWith({ approved: false });
    });

    it("should return 400 if deviceId is missing", async () => {
      mockRequest.body = {};

      await authController.validateDevice(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Device ID is required",
      });
    });

    it("should return 500 on service error", async () => {
      mockRequest.body = { deviceId: "device-error" };

      (authService.isDeviceApproved as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await authController.validateDevice(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(console.error).toHaveBeenCalledWith(
        "Error validating device:",
        expect.any(Error)
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Server error during device validation",
      });
    });
  });
});
