import type Stripe from "stripe";

import { stripe } from "@config/stripe";

export interface ChargeCustomerOptions {
  amount?: number;
  currency?: string;
  stripeClient?: StripeLike;
}

interface StripeLike {
  paymentMethods: {
    list: (
      params: Stripe.PaymentMethodListParams
    ) => Promise<{ data: Array<{ id: string }> }>;
  };
  paymentIntents: {
    create: (
      params: Stripe.PaymentIntentCreateParams
    ) => Promise<Stripe.PaymentIntent>;
  };
}

const DEFAULT_CHARGE_AMOUNT = 1099;
const DEFAULT_CURRENCY = "usd";

export async function chargeCustomer(
  customerId: string,
  options: ChargeCustomerOptions = {}
): Promise<Stripe.PaymentIntent> {
  if (!customerId) {
    throw new Error("customerId is required.");
  }

  const {
    amount = DEFAULT_CHARGE_AMOUNT,
    currency = DEFAULT_CURRENCY,
    stripeClient = stripe,
  } = options;

  const paymentMethods = await stripeClient.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  if (!paymentMethods.data.length) {
    throw new Error(`No payment methods found for customer ${customerId}.`);
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    payment_method: paymentMethods.data[0].id,
    off_session: true,
    confirm: true,
  });

  if (paymentIntent.status === "succeeded") {
    console.log("✅ Successfully charged card off session");
  }

  return paymentIntent;
}
