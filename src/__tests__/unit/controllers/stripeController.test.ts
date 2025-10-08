/**
 * Stripe Controller Tests
 */

import { Request, Response } from "express";
import * as stripeController from "../../../controllers/stripeController";
import * as stripeService from "../../../services/stripeService";

// Mock dependencies
jest.mock("../../../services/stripeService");

describe("Stripe Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;
  let redirectMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    redirectMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      send: sendMock,
      status: statusMock,
      redirect: redirectMock,
    };

    jest.clearAllMocks();
  });

  describe("createPortalRedirect", () => {
    it("should create billing portal session and redirect", async () => {
      const mockSession = {
        id: "bps_123",
        url: "https://billing.stripe.com/session/123",
        customer: "cus_123",
        return_url: "https://www.zdtamusement.com/account",
      };

      mockRequest.params = { customerId: "cus_123" };

      (stripeService.createBillingPortalSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      await stripeController.createPortalRedirect(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(stripeService.createBillingPortalSession).toHaveBeenCalledWith(
        "cus_123"
      );
      expect(redirectMock).toHaveBeenCalledWith(
        "https://billing.stripe.com/session/123"
      );
    });

    it("should handle errors when creating billing portal session", async () => {
      mockRequest.params = { customerId: "invalid_customer" };

      const mockError = new Error("Customer not found");
      (stripeService.createBillingPortalSession as jest.Mock).mockRejectedValue(
        mockError
      );

      await stripeController.createPortalRedirect(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(sendMock).toHaveBeenCalledWith({
        success: false,
        error: mockError,
      });
    });
  });

  describe("createPaymentIntent", () => {
    it("should create payment intent with all details", async () => {
      const mockResult = {
        clientSecret: "pi_123_secret_abc",
        customerId: "cus_123",
      };

      mockRequest.body = {
        amount: 5000,
        email: "test@example.com",
        name: "John Doe",
        phone: "+1234567890",
        address: { line1: "123 Main St" },
      };

      (
        stripeService.createPaymentIntentWithCustomer as jest.Mock
      ).mockResolvedValue(mockResult);

      await stripeController.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(stripeService.createPaymentIntentWithCustomer).toHaveBeenCalledWith(
        5000,
        "test@example.com",
        "John Doe",
        "+1234567890"
      );

      expect(sendMock).toHaveBeenCalledWith({
        clientSecret: "pi_123_secret_abc",
      });
    });

    it("should create payment intent with minimal details", async () => {
      const mockResult = {
        clientSecret: "pi_456_secret_xyz",
        customerId: "cus_456",
      };

      mockRequest.body = {
        amount: 2500,
        email: "minimal@example.com",
      };

      (
        stripeService.createPaymentIntentWithCustomer as jest.Mock
      ).mockResolvedValue(mockResult);

      await stripeController.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(stripeService.createPaymentIntentWithCustomer).toHaveBeenCalledWith(
        2500,
        "minimal@example.com",
        undefined,
        undefined
      );

      expect(sendMock).toHaveBeenCalledWith({
        clientSecret: "pi_456_secret_xyz",
      });
    });

    it("should handle errors when creating payment intent", async () => {
      mockRequest.body = {
        amount: 5000,
        email: "test@example.com",
      };

      const mockError = new Error("Invalid amount");
      (
        stripeService.createPaymentIntentWithCustomer as jest.Mock
      ).mockRejectedValue(mockError);

      await stripeController.createPaymentIntent(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith({
        success: false,
        error: mockError,
      });
    });
  });
});
