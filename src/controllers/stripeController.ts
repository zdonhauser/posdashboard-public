/**
 * Stripe Controller
 * Handles HTTP requests for Stripe billing portal and payment operations
 */

import { Request, Response } from "express";
import * as stripeService from "../services/stripeService";

/**
 * Create a billing portal redirect for a customer
 */
export async function createPortalRedirect(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const customerId = req.params.customerId;

    const session = await stripeService.createBillingPortalSession(customerId);
    res.redirect(session.url);
  } catch (error) {
    console.error("Error creating billing portal redirect:", error);
    res.send({ success: false, error });
  }
}

/**
 * Create a payment intent with customer creation
 */
export async function createPaymentIntent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { amount, email, name, phone, address } = req.body;

    const result = await stripeService.createPaymentIntentWithCustomer(
      amount,
      email,
      name,
      phone
    );

    res.send({
      clientSecret: result.clientSecret,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ success: false, error });
  }
}
