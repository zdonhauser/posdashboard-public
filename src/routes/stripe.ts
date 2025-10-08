/**
 * Stripe Routes
 * Defines all Stripe billing portal and payment-related API endpoints
 */

import { Router } from "express";
import * as stripeController from "../controllers/stripeController";

const router = Router();

/**
 * @route   POST /create-portal-redirect/:customerId
 * @desc    Create a Stripe billing portal session and redirect to it
 * @access  Public (no JWT required)
 * @param   customerId - Stripe customer ID
 */
router.post(
  "/create-portal-redirect/:customerId",
  stripeController.createPortalRedirect
);

/**
 * @route   POST /create-payment-intent
 * @desc    Create a payment intent with customer creation
 * @access  Public (no JWT required)
 * @body    { amount: number, email: string, name?: string, phone?: string, address?: object }
 */
router.post("/create-payment-intent", stripeController.createPaymentIntent);

export default router;
