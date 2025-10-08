import type { Request, Response } from "express";
import crypto from "crypto";

import { queryDB } from "@config/database";
import { shopifyConfig, createShopifyClient } from "@config/shopify";
import { stripe, endpointSecret } from "@config/stripe";
import { env } from "@config/environment";
import { acquireLock, releaseLock } from "@utils/locks";

type HmacHeader = string | string[] | undefined;

function toBuffer(body: Buffer | string): Buffer {
  if (Buffer.isBuffer(body)) {
    return body;
  }
  return Buffer.from(body, "utf8");
}

export interface ShopifyLineItem {
  name: string;
  id: string;
  sku: string;
  price: number;
  quantity: number;
  variant_title?: string;
  title?: string;
}

export interface ShopifyRefundItem {
  line_item: {
    id: string;
  };
  quantity: number;
}

export interface ShopifyRefund {
  refund_line_items: ShopifyRefundItem[];
}

export interface ShopifyOrder {
  id: string;
  line_items: ShopifyLineItem[];
  refunds?: ShopifyRefund[];
  updated_at: string;
}

export interface OrderItemSummary {
  name: string;
  id: string;
  sku: string;
  price: number;
  quantity: number;
  totalAmount: number;
  category: string;
  orderId: string;
}

export interface GiftCardRecord {
  items: string;
  card_number: string;
  is_donation: boolean;
  issued_to: string;
  notes: string | null;
  expiration: string | null;
  valid_starting: string | null;
}

export function verifyShopifySignature(
  rawBody: Buffer | string,
  secret: string,
  hmacHeader: HmacHeader
): boolean {
  if (!hmacHeader || Array.isArray(hmacHeader)) {
    return false;
  }

  const computedHmac = crypto
    .createHmac("sha256", secret)
    .update(toBuffer(rawBody))
    .digest("base64");

  try {
    const expected = Buffer.from(computedHmac, "base64");
    const provided = Buffer.from(hmacHeader, "base64");

    if (expected.length !== provided.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function getItemsFromOrder(order: ShopifyOrder): OrderItemSummary[] {
  const lineItems = (order.line_items || []).map((item) => ({
    name: item.name,
    id: item.id,
    sku: item.sku,
    price: item.price,
    quantity: item.quantity,
    totalAmount: item.price * item.quantity,
    category: "Uncategorized",
    orderId: order.id,
  }));

  const refundedItems = (order.refunds || []).flatMap((refund) =>
    refund.refund_line_items.map((refundItem) => ({
      id: refundItem.line_item.id,
      quantity: -refundItem.quantity,
    }))
  );

  return lineItems.map((item) => {
    const refunded = refundedItems.find(
      (refundItem) => refundItem.id === item.id
    );
    if (!refunded) {
      return item;
    }

    const quantity = item.quantity + refunded.quantity;
    return {
      ...item,
      quantity,
      totalAmount: item.price * quantity,
    };
  });
}

export function getPrintableCardsFromOrder(
  order: ShopifyOrder
): ShopifyLineItem[] {
  return (order.line_items || []).filter((item) =>
    item.variant_title?.includes("Printable")
  );
}

export function createGiftCardObjects(
  printableCards: ShopifyLineItem[],
  orderId: string
): GiftCardRecord[] {
  return printableCards
    .map((item) => {
      let title = `${item.title ?? item.name} ${item.variant_title ?? ""}`.trim();
      let validAfter: string | null = null;

      if (title.includes("12/25/2024")) {
        validAfter = "12/25/2024";
      }

      if (title.includes("Eat & Play") || title.includes("Add a Combo Meal")) {
        title = "Eat & Play Combo";
      } else if (
        title.includes("Unlimited Wristband") ||
        title.includes("Unlimited Band")
      ) {
        title = "Unlimited Wristband";
      } else {
        return null;
      }

      return {
        items: title,
        card_number: item.id.toString(),
        is_donation: false,
        issued_to: `Order ${orderId}`,
        notes: null,
        expiration: null,
        valid_starting: validAfter,
      };
    })
    .filter((card): card is GiftCardRecord => Boolean(card?.items && card.card_number));
}

export async function insertGiftCard(
  giftcard: GiftCardRecord,
  runner: typeof queryDB = queryDB
): Promise<void> {
  const {
    items,
    card_number,
    is_donation,
    issued_to,
    notes,
    expiration,
    valid_starting,
  } = giftcard;

  await runner(
    `
      INSERT INTO gift_cards (card_number, items, issue_timestamp, is_donation, issued_to, notes, expiration, valid_starting)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
    [
      card_number,
      items,
      new Date(),
      is_donation,
      issued_to,
      notes,
      expiration,
      valid_starting,
    ]
  );
}

function parseJson<T>(raw: Buffer | string): T {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : raw;
  return JSON.parse(text) as T;
}

export async function handleShopifyNewTransaction(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const hmac = req.get("X-Shopify-Hmac-Sha256");
    if (
      !verifyShopifySignature(req.body, shopifyConfig.webhookSecret, hmac)
    ) {
      console.log("Webhook signature is not valid.");
      return res.status(401).send("Webhook signature is not valid.");
    }

    const transaction = parseJson<any>(req.body);
    const query = `
      INSERT INTO transactions (
        id, order_id, kind, gateway, status, message, created_at, test, "authorization",
        location_id, user_id, parent_id, processed_at, device_id, error_code, source_name,
        amount, currency, payment_id, manual_payment_gateway, admin_graphql_api_id, webhook
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `;
    const values = [
      transaction.id,
      transaction.order_id,
      transaction.kind,
      transaction.gateway,
      transaction.status,
      transaction.message,
      new Date(transaction.created_at),
      transaction.test,
      transaction.authorization,
      transaction.location_id,
      transaction.user_id,
      transaction.parent_id,
      new Date(transaction.processed_at),
      transaction.device_id,
      transaction.error_code,
      transaction.source_name,
      parseFloat(transaction.amount),
      transaction.currency,
      transaction.payment_id,
      transaction.manual_payment_gateway,
      transaction.admin_graphql_api_id,
      transaction,
    ];

    const result = await queryDB(query, values);
    console.log("Transaction inserted:", result.rows[0]);
    return res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error handling new transaction webhook:", error);
    return res.status(500).send("Server error");
  }
}

function normalizeStoredOrder(order: unknown): ShopifyOrder {
  if (!order) {
    throw new Error("Missing order payload");
  }

  if (typeof order === "string") {
    return JSON.parse(order);
  }

  return order as ShopifyOrder;
}

export async function handleShopifyOrderUpdate(
  req: Request,
  res: Response
): Promise<Response> {
  const hmac = req.get("X-Shopify-Hmac-Sha256");
  if (!verifyShopifySignature(req.body, shopifyConfig.webhookSecret, hmac)) {
    console.log("Webhook signature is not valid.");
    return res.status(401).send("Webhook signature is not valid.");
  }

  const order = parseJson<ShopifyOrder>(req.body);
  await acquireLock(order.id);

  try {
    const newItems = getItemsFromOrder(order);

    const existingOrderResult = await queryDB(
      "SELECT * FROM orders WHERE shopify_order_id = $1 ORDER BY shopify_order_id DESC LIMIT 1",
      [order.id]
    );

    const existingOrder = existingOrderResult.rows[0];

    if (existingOrder?.full_order) {
      const existingItems = getItemsFromOrder(
        normalizeStoredOrder(existingOrder.full_order)
      );

      const diff = newItems
        .map((newItem) => {
          const match = existingItems.find((item) => item.id === newItem.id);
          if (!match) {
            return newItem;
          }
          const quantityDifference = newItem.quantity - match.quantity;
          return {
            ...newItem,
            quantity: quantityDifference,
            totalAmount: quantityDifference * newItem.price,
          };
        })
        .filter((item) => item.quantity !== 0);

      if (diff.length > 0) {
        for (const item of diff) {
          console.log("Trying to insert the following item now: ", [
            item.id,
            item.name,
            item.sku,
            item.price,
            item.quantity,
            item.totalAmount,
            item.category,
            item.orderId,
          ]);
          await queryDB(
            `
              INSERT INTO line_item_sales (line_item_id, name, sku, price, quantity_sold, total_amount_received, category, shopify_order_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING *`,
            [
              item.id,
              item.name,
              item.sku,
              item.price,
              item.quantity,
              item.totalAmount,
              item.category,
              item.orderId,
            ]
          );
        }
        await queryDB(
          `INSERT INTO orders (shopify_order_id, full_order, shopify_updated_at) VALUES ($1, $2, $3)`,
          [order.id, JSON.stringify(order), order.updated_at]
        );
      }
    } else {
      const insertions = newItems.map((item) => [
        item.id,
        item.name,
        item.sku,
        item.price,
        item.quantity,
        item.totalAmount,
        item.category,
        item.orderId,
      ]);

      for (const values of insertions) {
        console.log("Trying to insert the following item: ", values);
        await queryDB(
          `
            INSERT INTO line_item_sales (line_item_id, name, sku, price, quantity_sold, total_amount_received, category, shopify_order_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
          values
        );
      }

      await queryDB(
        `INSERT INTO orders (shopify_order_id, full_order, shopify_updated_at) VALUES ($1, $2, $3)`,
        [order.id, JSON.stringify(order), order.updated_at]
      );
    }

    console.log("Order processed:", order.id);
    return res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error handling order update webhook:", error);
    return res.status(500).send("Server error");
  } finally {
    releaseLock(order.id);
  }
}

export async function handleShopifyOrderCreation(
  req: Request,
  res: Response
): Promise<Response> {
  const hmac = req.get("X-Shopify-Hmac-Sha256");
  if (!verifyShopifySignature(req.body, shopifyConfig.webhookSecret, hmac)) {
    console.log("Webhook signature is not valid.");
    return res.status(401).send("Webhook signature is not valid.");
  }

  const order = parseJson<ShopifyOrder>(req.body);
  await acquireLock(order.id);

  try {
    console.log("Processing order ID:", order.id);
    const printableCards = getPrintableCardsFromOrder(order);

    if (printableCards.length > 0) {
      const giftCardObjects = createGiftCardObjects(printableCards, order.id);
      console.log("Gift Card Objects:", giftCardObjects);

      for (const giftcard of giftCardObjects) {
        console.log("Inserting gift card:", giftcard.card_number);
        await insertGiftCard(giftcard);
      }
    } else {
      console.log("No printable cards found in order:", order.id);
    }

    return res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error handling order creation webhook:", error);
    return res.status(500).send("Server error");
  } finally {
    releaseLock(order.id);
    console.log("Lock released for order ID:", order.id);
  }
}

export function verifySealWebhook(
  rawBody: Buffer | string,
  secret: string,
  hmacHeader: HmacHeader
): boolean {
  if (!hmacHeader || Array.isArray(hmacHeader)) {
    return false;
  }

  const computed = crypto
    .createHmac("sha256", secret)
    .update(toBuffer(rawBody))
    .digest("base64");

  try {
    const expected = Buffer.from(computed, "base64");
    const provided = Buffer.from(hmacHeader, "base64");

    if (expected.length !== provided.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

function convertDateFormat(dateStr: string | null): string | null {
  if (!dateStr) {
    return null;
  }

  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(\d{2}|\d{4})$/;
  if (!regex.test(dateStr)) {
    return null;
  }

  let [month, day, year] = dateStr.split("/");

  if (year.length === 2) {
    year = parseInt(year, 10) < 30 ? `20${year}` : `19${year}`;
  }

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  if (
    date.getFullYear() !== parseInt(year, 10) ||
    date.getMonth() + 1 !== parseInt(month, 10) ||
    date.getDate() !== parseInt(day, 10)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

interface SealSubscriptionProperty {
  key: string;
  value: string | null;
}

interface SealSubscriptionItem {
  title: string;
  quantity: number;
  properties: SealSubscriptionProperty[];
  selling_plan_id?: string | null;
}

interface SealSubscriptionPayload {
  id: string;
  email?: string | null;
  items: SealSubscriptionItem[];
}

export async function handleSealSubscriptionWebhook(
  req: Request,
  res: Response
): Promise<Response> {
  const hmacHeader = req.get("X-Seal-Hmac-Sha256");
  if (!verifySealWebhook(req.body, env.seal.secret, hmacHeader)) {
    console.log("Webhook verification failed");
    // Intentionally continue processing as original implementation
  }

  try {
    const subscriptionData = parseJson<SealSubscriptionPayload>(req.body);

    console.log("sub received: ", JSON.stringify(subscriptionData));

    for (const item of subscriptionData.items) {
      const membershipType = item.title.split(" - ")[0];
      console.log("membership type: ", membershipType);

      if (!membershipType.includes("Member")) {
        continue;
      }

      for (let i = 1; i <= item.quantity; i += 1) {
        let memberName: string | null = null;
        let memberDob: string | null = null;
        let barcode: string | null = null;
        const sellingPlan = item.selling_plan_id || null;

        for (const property of item.properties) {
          if (property.key === `name_${i}` || property.key === "Name") {
            memberName = property.value;
          }
          if (property.key === `dob_${i}` || property.key === "Date of Birth") {
            memberDob = property.value;
          }
          if (property.key === "gcid") {
            barcode = property.value;
          }
        }

        const dob = convertDateFormat(memberDob);
        const subId = subscriptionData.id || null;
        const email = subscriptionData.email || null;

        const query = `
          INSERT INTO memberships (name, membership_type, dob, sub_id,_seal_selling_plan_id,barcode,email)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;`;

        const params = [
          memberName,
          membershipType,
          dob,
          subId,
          sellingPlan,
          barcode,
          email,
        ];

        console.log("params:", params);
        const { rows } = await queryDB(query, params);
        console.log("New member added:", rows[0]);
      }
    }

    return res.status(200).send("Success");
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return res.status(500).send("Server Error");
  }
}

export async function handleStripeWebhook(
  request: Request,
  response: Response
): Promise<Response | void> {
  let event: any = request.body;

  if (endpointSecret) {
    const signature = request.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  console.log("webhook activated!");

  switch (event.type) {
    case "order.created": {
      const order = event.data.object;
      console.log(`creating an order with this data: ${order}`);
      const orderData = {
        line_items: order.line_items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.amount / 100,
        })),
        email: order.email,
        financial_status: "paid",
      };

      console.log(`orderData: ${JSON.stringify(orderData)}`);
      return response.sendStatus(200);
    }
    case "customer.created": {
      const customer = event.data.object;
      const stripeCustomerId = customer.id;
      const customerEmail = customer.email;
      const shopifyInstance = createShopifyClient();

      if (customerEmail) {
        shopifyInstance.customer
          .search({ query: customerEmail, limit: 1 })
          .then((customers) => {
            if (customers.length > 0) {
              console.log("found a customer!");
              const shopifyCustomer = customers[0];
              console.log(`customer ID: ${shopifyCustomer.id}`);
              return shopifyInstance.customer.update(shopifyCustomer.id, {
                metafields: [
                  {
                    key: "stripe_customer_id",
                    value: stripeCustomerId,
                    type: "single_line_text_field",
                    namespace: "global",
                  },
                ],
              });
            }

            return shopifyInstance.customer.create({
              email: customerEmail,
              metafields: [
                {
                  key: "stripe_customer_id",
                  value: stripeCustomerId,
                  type: "single_line_text_field",
                  namespace: "global",
                },
              ],
              first_name: customer.name || "No Name Given",
            });
          })
          .then((result) => {
            if (result) {
              console.log(
                `Created or updated Shopify customer with Stripe customer ID: ${customerEmail}`
              );
            }
            response.sendStatus(200);
          })
          .catch((error) => {
            console.log(
              `Error syncing Shopify customer with Stripe customer ID: ${error}`
            );
            response.sendStatus(500);
          });
      } else {
        response.sendStatus(200);
      }
      return;
    }
    default:
      console.log(`Unhandled event type ${event.type}.`);
      return response.sendStatus(200);
  }
}
