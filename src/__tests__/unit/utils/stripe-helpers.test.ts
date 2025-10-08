import { chargeCustomer } from "@utils/stripe-helpers";

describe("utils/stripe-helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a payment intent for the first saved card", async () => {
    const paymentMethods = {
      list: jest.fn().mockResolvedValue({
        data: [{ id: "pm_123" }],
      }),
    };
    const paymentIntent = {
      id: "pi_123",
      status: "succeeded",
    };
    const paymentIntents = {
      create: jest.fn().mockResolvedValue(paymentIntent),
    };
    const stripeClient = {
      paymentMethods,
      paymentIntents,
    };

    jest.spyOn(console, "log").mockImplementation(() => {});

    const result = await chargeCustomer("cus_123", {
      stripeClient: stripeClient as any,
      amount: 555,
      currency: "eur",
    });

    expect(paymentMethods.list).toHaveBeenCalledWith({
      customer: "cus_123",
      type: "card",
    });
    expect(paymentIntents.create).toHaveBeenCalledWith({
      amount: 555,
      currency: "eur",
      customer: "cus_123",
      payment_method: "pm_123",
      off_session: true,
      confirm: true,
    });
    expect(result).toBe(paymentIntent);
  });

  it("throws when no payment methods are available", async () => {
    const stripeClient = {
      paymentMethods: {
        list: jest.fn().mockResolvedValue({ data: [] }),
      },
      paymentIntents: {
        create: jest.fn(),
      },
    };

    await expect(
      chargeCustomer("cus_456", { stripeClient: stripeClient as any })
    ).rejects.toThrow("No payment methods found for customer cus_456.");
  });

  it("requires a customer id", async () => {
    await expect(chargeCustomer("")).rejects.toThrow(
      "customerId is required."
    );
  });
});
