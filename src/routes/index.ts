/**
 * Route Index
 * Aggregates and exports all API route modules
 */

import { Express } from "express";
import employeeRoutes, { employeePublicRoutes } from "./employees";
import membershipRoutes from "./memberships";
import giftcardRoutes from "./giftcards";
import kdsRoutes from "./kds";
import orderRoutes from "./orders";
import customerRoutes from "./customers";
import shopifyRoutes from "./shopify";
import transactionRoutes from "./transactions";
import posRoutes from "./pos";
import stripeRoutes from "./stripe";
import authRoutes from "./auth";

/**
 * Mount all API routes on the Express app
 * Handles route ordering and middleware dependencies
 *
 * @param app Express application instance
 */
export function registerRoutes(app: Express): void {
  // Auth routes (must be before JWT middleware)
  app.use("/api", authRoutes);

  // Employee public routes (must be before JWT middleware)
  app.use("/api", employeePublicRoutes);

  // Protected API routes (require JWT authentication)
  app.use("/api", employeeRoutes);
  app.use("/api", membershipRoutes);
  app.use("/api", giftcardRoutes);
  app.use("/api", kdsRoutes);
  app.use("/api", orderRoutes);
  app.use("/api", customerRoutes);
  app.use("/api", shopifyRoutes);
  app.use("/api", transactionRoutes);
  app.use("/api", posRoutes);

  // Stripe routes (no /api prefix - these are public endpoints)
  app.use(stripeRoutes);
}

/**
 * Export individual route modules for testing or custom mounting
 */
export {
  employeeRoutes,
  employeePublicRoutes,
  membershipRoutes,
  giftcardRoutes,
  kdsRoutes,
  orderRoutes,
  customerRoutes,
  shopifyRoutes,
  transactionRoutes,
  posRoutes,
  stripeRoutes,
  authRoutes,
};
