import express, { Express, Router } from "express";
import bodyParser from "body-parser";

import {
  handleShopifyNewTransaction,
  handleShopifyOrderUpdate,
  handleShopifyOrderCreation,
  handleStripeWebhook,
  handleSealSubscriptionWebhook,
} from "@controllers/webhookController";

export interface WebhookRouteOptions {
  enableShopifyOrderRoutes?: boolean;
}

export function registerWebhookRoutes(
  app: Express,
  options: WebhookRouteOptions = {}
): void {
  const router = Router();
  const enableShopifyOrderRoutes =
    options.enableShopifyOrderRoutes ?? true;

  router.post(
    "/webhook/new-transaction",
    bodyParser.raw({ type: "application/json" }),
    handleShopifyNewTransaction
  );

  if (enableShopifyOrderRoutes) {
    router.post(
      "/webhook/order-update",
      bodyParser.raw({ type: "application/json" }),
      handleShopifyOrderUpdate
    );

    router.post(
      "/webhook/order-creation",
      bodyParser.raw({ type: "application/json" }),
      handleShopifyOrderCreation
    );
  }

  router.use(
    "/stripe-webhook",
    bodyParser.raw({ type: "*/*" })
  );

  router.post(
    "/stripe-webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  router.post(
    "/webhook/receive-new-sub",
    bodyParser.raw({ type: "*/*" }),
    handleSealSubscriptionWebhook
  );

  app.use(router);
}
