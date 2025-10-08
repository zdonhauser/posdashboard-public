/**
 * Media Controller Tests
 */

import { Request, Response } from "express";
import { createQRController, createCardController } from "../../../controllers/mediaController";

describe("Media Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let endMock: jest.Mock;
  let setHeaderMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    endMock = jest.fn();
    setHeaderMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ send: sendMock });

    mockRequest = {
      params: {},
    };

    mockResponse = {
      end: endMock,
      setHeader: setHeaderMock,
      status: statusMock,
      send: sendMock,
    };

    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("QR Controller", () => {
    it("should generate QR code successfully", async () => {
      const mockBuffer = Buffer.from("fake-qr-image");
      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(mockBuffer),
      };

      mockRequest.params = { data: "test-data" };

      const controller = createQRController(mockGenerator);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(mockGenerator.generate).toHaveBeenCalledWith("test-data");
      expect(setHeaderMock).toHaveBeenCalledWith("Content-Type", "image/jpg");
      expect(setHeaderMock).toHaveBeenCalledWith(
        "Content-Disposition",
        'inline; filename="test-data.jpg"'
      );
      expect(endMock).toHaveBeenCalledWith(mockBuffer);
    });

    it("should handle errors during QR generation", async () => {
      const mockError = new Error("QR generation failed");
      const mockGenerator = {
        generate: jest.fn().mockRejectedValue(mockError),
      };

      mockRequest.params = { data: "test-data" };

      const controller = createQRController(mockGenerator);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(console.error).toHaveBeenCalledWith(
        "Error generating QR code:",
        mockError
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith("Error generating QR code");
    });
  });

  describe("Card Controller", () => {
    it("should generate card image successfully", async () => {
      const mockBuffer = Buffer.from("fake-card-image");
      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(mockBuffer),
      };

      mockRequest.params = {
        cardType: "membership",
        data: "test-data",
        type: "Annual+Pass",
      };

      const controller = createCardController(mockGenerator);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        cardType: "membership",
        data: "test-data",
        type: "Annual Pass", // Note: + replaced with space
      });
      expect(setHeaderMock).toHaveBeenCalledWith("Content-Type", "image/png");
      expect(endMock).toHaveBeenCalledWith(mockBuffer);
    });

    it("should decode URI components in parameters", async () => {
      const mockBuffer = Buffer.from("fake-card-image");
      const mockGenerator = {
        generate: jest.fn().mockResolvedValue(mockBuffer),
      };

      mockRequest.params = {
        cardType: "gift%20card",
        data: "test%20data",
        type: "special",
      };

      const controller = createCardController(mockGenerator);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        cardType: "gift card",
        data: "test data",
        type: "special",
      });
    });

    it("should handle null generator", async () => {
      mockRequest.params = {
        cardType: "test",
        data: "test",
        type: "test",
      };

      const controller = createCardController(null);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(console.error).toHaveBeenCalledWith(
        "Card generator unavailable: canvas dependencies missing."
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith("Error generating ticket image");
    });

    it("should handle errors during card generation", async () => {
      const mockError = new Error("Card generation failed");
      const mockGenerator = {
        generate: jest.fn().mockRejectedValue(mockError),
      };

      mockRequest.params = {
        cardType: "test",
        data: "test",
        type: "test",
      };

      const controller = createCardController(mockGenerator);
      await controller(mockRequest as Request, mockResponse as Response);

      expect(console.error).toHaveBeenCalledWith(
        "Error generating ticket image:",
        mockError
      );
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith("Error generating ticket image");
    });
  });
});
