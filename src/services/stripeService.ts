/**
 * Stripe Service
 * Handles business logic for Stripe billing portal and payment operations
 */

import { stripe } from "@config/stripe";
import Stripe from "stripe";

/**
 * Create a Stripe billing portal session for a customer
 *
 * @param customerId Stripe customer ID
 * @param returnUrl URL to redirect after portal session
 * @returns Billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string = "https://www.zdtamusement.com/account"
): Promise<Stripe.BillingPortal.Session> {
  console.log("Creating billing portal for customer:", customerId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Create a payment intent with customer creation
 *
 * @param amount Amount in cents
 * @param email Customer email
 * @param name Customer name
 * @param phone Customer phone
 * @returns Object containing client secret and customer ID
 */
export async function createPaymentIntentWithCustomer(
  amount: number,
  email: string,
  name?: string,
  phone?: string
): Promise<{ clientSecret: string | null; customerId: string }> {
  // Create customer first
  const customer = await stripe.customers.create({
    email: email,
    name: name,
    phone: phone,
  });

  // Create payment intent for the customer
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customer.id,
    setup_future_usage: "off_session",
    amount: amount,
    currency: "usd",
  });

  return {
    clientSecret: paymentIntent.client_secret,
    customerId: customer.id,
  };
}
