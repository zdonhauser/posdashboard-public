/**
 * Unit tests for Stripe Service
 */

import * as stripeService from "../../../services/stripeService";
import { stripe } from "../../../config/stripe";

// Mock Stripe
jest.mock("../../../config/stripe");

describe("Stripe Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBillingPortalSession", () => {
    it("should create a billing portal session with default return URL", async () => {
      const mockSession = {
        id: "bps_123",
        url: "https://billing.stripe.com/session/123",
        customer: "cus_123",
        return_url: "https://www.zdtamusement.com/account",
      };

      const mockCreate = jest.fn().mockResolvedValue(mockSession);
      (stripe.billingPortal.sessions as any) = {
        create: mockCreate,
      };

      const result = await stripeService.createBillingPortalSession("cus_123");

      expect(mockCreate).toHaveBeenCalledWith({
        customer: "cus_123",
        return_url: "https://www.zdtamusement.com/account",
      });
      expect(result).toEqual(mockSession);
    });

    it("should create a billing portal session with custom return URL", async () => {
      const mockSession = {
        id: "bps_123",
        url: "https://billing.stripe.com/session/123",
        customer: "cus_123",
        return_url: "https://example.com/custom-return",
      };

      const mockCreate = jest.fn().mockResolvedValue(mockSession);
      (stripe.billingPortal.sessions as any) = {
        create: mockCreate,
      };

      const result = await stripeService.createBillingPortalSession(
        "cus_123",
        "https://example.com/custom-return"
      );

      expect(mockCreate).toHaveBeenCalledWith({
        customer: "cus_123",
        return_url: "https://example.com/custom-return",
      });
      expect(result).toEqual(mockSession);
    });

    it("should handle errors when creating billing portal session", async () => {
      const mockCreate = jest
        .fn()
        .mockRejectedValue(new Error("Customer not found"));
      (stripe.billingPortal.sessions as any) = {
        create: mockCreate,
      };

      await expect(
        stripeService.createBillingPortalSession("invalid_customer")
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("createPaymentIntentWithCustomer", () => {
    it("should create customer and payment intent with all details", async () => {
      const mockCustomer = {
        id: "cus_123",
        email: "test@example.com",
        name: "John Doe",
        phone: "+1234567890",
      };

      const mockPaymentIntent = {
        id: "pi_123",
        client_secret: "pi_123_secret_abc",
        customer: "cus_123",
        amount: 5000,
        currency: "usd",
        setup_future_usage: "off_session",
      };

      const mockCustomersCreate = jest.fn().mockResolvedValue(mockCustomer);
      const mockPaymentIntentsCreate = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      (stripe.customers as any) = {
        create: mockCustomersCreate,
      };
      (stripe.paymentIntents as any) = {
        create: mockPaymentIntentsCreate,
      };

      const result = await stripeService.createPaymentIntentWithCustomer(
        5000,
        "test@example.com",
        "John Doe",
        "+1234567890"
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: "test@example.com",
        name: "John Doe",
        phone: "+1234567890",
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
        customer: "cus_123",
        setup_future_usage: "off_session",
        amount: 5000,
        currency: "usd",
      });

      expect(result).toEqual({
        clientSecret: "pi_123_secret_abc",
        customerId: "cus_123",
      });
    });

    it("should create customer and payment intent with only email", async () => {
      const mockCustomer = {
        id: "cus_456",
        email: "minimal@example.com",
      };

      const mockPaymentIntent = {
        id: "pi_456",
        client_secret: "pi_456_secret_xyz",
        customer: "cus_456",
        amount: 2500,
        currency: "usd",
        setup_future_usage: "off_session",
      };

      const mockCustomersCreate = jest.fn().mockResolvedValue(mockCustomer);
      const mockPaymentIntentsCreate = jest
        .fn()
        .mockResolvedValue(mockPaymentIntent);

      (stripe.customers as any) = {
        create: mockCustomersCreate,
      };
      (stripe.paymentIntents as any) = {
        create: mockPaymentIntentsCreate,
      };

      const result = await stripeService.createPaymentIntentWithCustomer(
        2500,
        "minimal@example.com"
      );

      expect(mockCustomersCreate).toHaveBeenCalledWith({
        email: "minimal@example.com",
        name: undefined,
        phone: undefined,
      });

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
        customer: "cus_456",
        setup_future_usage: "off_session",
        amount: 2500,
        currency: "usd",
      });

      expect(result).toEqual({
        clientSecret: "pi_456_secret_xyz",
        customerId: "cus_456",
      });
    });

    it("should handle errors during customer creation", async () => {
      const mockCustomersCreate = jest
        .fn()
        .mockRejectedValue(new Error("Invalid email"));

      (stripe.customers as any) = {
        create: mockCustomersCreate,
      };

      await expect(
        stripeService.createPaymentIntentWithCustomer(
          5000,
          "invalid-email"
        )
      ).rejects.toThrow("Invalid email");
    });

    it("should handle errors during payment intent creation", async () => {
      const mockCustomer = {
        id: "cus_789",
        email: "test@example.com",
      };

      const mockCustomersCreate = jest.fn().mockResolvedValue(mockCustomer);
      const mockPaymentIntentsCreate = jest
        .fn()
        .mockRejectedValue(new Error("Amount too low"));

      (stripe.customers as any) = {
        create: mockCustomersCreate,
      };
      (stripe.paymentIntents as any) = {
        create: mockPaymentIntentsCreate,
      };

      await expect(
        stripeService.createPaymentIntentWithCustomer(
          10,
          "test@example.com"
        )
      ).rejects.toThrow("Amount too low");
    });
  });
});
