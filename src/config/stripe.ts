/**
 * Stripe Configuration
 *
 * Stripe payment processing client initialization
 * and configuration management.
 */

import Stripe from 'stripe';
import { env } from './environment';

/**
 * Stripe client instance
 * Initialized with secret key from environment variables
 */
export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: env.stripe.apiVersion as Stripe.LatestApiVersion,
  typescript: true,
});

/**
 * Stripe webhook endpoint secret
 * Used for verifying webhook signatures
 */
export const endpointSecret = env.stripe.endpointSecret;

/**
 * Create a payment intent
 *
 * @param amount Amount in cents
 * @param currency Currency code (e.g., 'usd')
 * @param metadata Optional metadata
 * @returns Payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Stripe.MetadataParam
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });
}

/**
 * Retrieve a payment intent
 *
 * @param paymentIntentId Payment intent ID
 * @returns Payment intent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create a refund
 *
 * @param chargeId Charge ID to refund
 * @param amount Optional amount in cents (full refund if not specified)
 * @param reason Optional refund reason
 * @returns Refund
 */
export async function createRefund(
  chargeId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  const params: Stripe.RefundCreateParams = {
    charge: chargeId,
  };

  if (amount) {
    params.amount = amount;
  }

  if (reason) {
    params.reason = reason;
  }

  return await stripe.refunds.create(params);
}

/**
 * Create a Stripe customer
 *
 * @param email Customer email
 * @param name Optional customer name
 * @param metadata Optional metadata
 * @returns Customer
 */
export async function createStripeCustomer(
  email: string,
  name?: string,
  metadata?: Stripe.MetadataParam
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

/**
 * Retrieve a Stripe customer
 *
 * @param customerId Customer ID
 * @returns Customer
 */
export async function retrieveStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  return await stripe.customers.retrieve(customerId);
}

/**
 * Verify webhook signature
 *
 * @param payload Raw request body
 * @param signature Stripe signature header
 * @param secret Webhook secret (defaults to endpointSecret)
 * @returns Verified webhook event
 * @throws Error if signature is invalid
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string = endpointSecret
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Create a checkout session
 *
 * @param params Checkout session parameters
 * @returns Checkout session
 */
export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create(params);
}

/**
 * Retrieve a checkout session
 *
 * @param sessionId Session ID
 * @returns Checkout session
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}
