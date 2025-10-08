/**
 * Stripe API Type Definitions
 *
 * This file contains TypeScript interfaces for Stripe-specific
 * operations, webhooks, and payment processing.
 */

/**
 * Stripe Customer Charge Request
 */
export interface StripeChargeRequest {
  customer_id: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Stripe Payment Intent Request
 */
export interface StripePaymentIntentRequest {
  amount: number;
  currency: string;
  customer?: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, string>;
  automatic_payment_methods?: {
    enabled: boolean;
  };
}

/**
 * Stripe Customer Portal Request
 */
export interface StripeCustomerPortalRequest {
  customer_id: string;
  return_url: string;
}

/**
 * Stripe Webhook Event Types
 */
export type StripeWebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'refund.created'
  | 'refund.updated';

/**
 * Stripe Webhook Event
 */
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: any;
    previous_attributes?: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: StripeWebhookEventType;
}

/**
 * Stripe Payment Intent
 */
export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amount_capturable: number;
  amount_received: number;
  currency: string;
  customer: string | null;
  description: string | null;
  metadata: Record<string, string>;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';
}

/**
 * Stripe Charge
 */
export interface StripeCharge {
  id: string;
  object: 'charge';
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  currency: string;
  customer: string | null;
  description: string | null;
  metadata: Record<string, string>;
  paid: boolean;
  refunded: boolean;
  status: 'succeeded' | 'pending' | 'failed';
}

/**
 * Stripe Refund
 */
export interface StripeRefund {
  id: string;
  object: 'refund';
  amount: number;
  charge: string;
  currency: string;
  metadata: Record<string, string>;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | null;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
}

/**
 * Stripe Customer
 */
export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string | null;
  name: string | null;
  phone: string | null;
  metadata: Record<string, string>;
  created: number;
  balance: number;
}

/**
 * Stripe Subscription
 */
export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
        unit_amount: number;
        currency: string;
      };
      quantity: number;
    }>;
  };
  metadata: Record<string, string>;
}

/**
 * Stripe Invoice
 */
export interface StripeInvoice {
  id: string;
  object: 'invoice';
  customer: string;
  subscription: string | null;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  paid: boolean;
  metadata: Record<string, string>;
}

/**
 * Stripe Terminal Reader
 */
export interface StripeTerminalReader {
  id: string;
  object: 'terminal.reader';
  device_type: string;
  label: string;
  location: string;
  serial_number: string;
  status: 'online' | 'offline';
}

/**
 * Stripe Error
 */
export interface StripeError {
  type: string;
  message: string;
  code?: string;
  param?: string;
  charge?: string;
}
