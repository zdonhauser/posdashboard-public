/**
 * Shopify Configuration
 *
 * Shopify client initialization and helper functions
 * for e-commerce operations.
 */

import Shopify from 'shopify-api-node';
import { env } from './environment';

/**
 * Shopify client configuration
 */
export const shopifyConfig = {
  shopName: env.shopify.shopName,
  apiKey: env.shopify.apiKey,
  password: env.shopify.password,
  accessToken: env.shopify.token,
  webhookSecret: env.shopify.webhookSecret,
};

/**
 * Create a Shopify client instance
 *
 * @returns Shopify client
 */
export function createShopifyClient(): Shopify {
  return new Shopify({
    shopName: shopifyConfig.shopName,
    apiKey: shopifyConfig.apiKey,
    password: shopifyConfig.password,
  });
}

/**
 * Global Shopify client instance
 * Use this for most operations
 */
export const shopify = createShopifyClient();

/**
 * Get all products from Shopify
 *
 * @param params Optional query parameters
 * @returns Array of products
 */
export async function getAllProducts(params?: any) {
  return await shopify.product.list(params);
}

/**
 * Get a single product by ID
 *
 * @param productId Product ID
 * @returns Product
 */
export async function getProduct(productId: number) {
  return await shopify.product.get(productId);
}

/**
 * Create a new product
 *
 * @param productData Product data
 * @returns Created product
 */
export async function createProduct(productData: any) {
  return await shopify.product.create(productData);
}

/**
 * Update an existing product
 *
 * @param productId Product ID
 * @param productData Updated product data
 * @returns Updated product
 */
export async function updateProduct(productId: number, productData: any) {
  return await shopify.product.update(productId, productData);
}

/**
 * Delete a product
 *
 * @param productId Product ID
 */
export async function deleteProduct(productId: number) {
  return await shopify.product.delete(productId);
}

/**
 * Get all orders from Shopify
 *
 * @param params Optional query parameters
 * @returns Array of orders
 */
export async function getAllOrders(params?: any) {
  return await shopify.order.list(params);
}

/**
 * Get a single order by ID
 *
 * @param orderId Order ID
 * @returns Order
 */
export async function getOrder(orderId: number) {
  return await shopify.order.get(orderId);
}

/**
 * Create a new order
 *
 * @param orderData Order data
 * @returns Created order
 */
export async function createOrder(orderData: any) {
  return await shopify.order.create(orderData);
}

/**
 * Update an existing order
 *
 * @param orderId Order ID
 * @param orderData Updated order data
 * @returns Updated order
 */
export async function updateOrder(orderId: number, orderData: any) {
  return await shopify.order.update(orderId, orderData);
}

/**
 * Get all customers from Shopify
 *
 * @param params Optional query parameters
 * @returns Array of customers
 */
export async function getAllCustomers(params?: any) {
  return await shopify.customer.list(params);
}

/**
 * Get a single customer by ID
 *
 * @param customerId Customer ID
 * @returns Customer
 */
export async function getCustomer(customerId: number) {
  return await shopify.customer.get(customerId);
}

/**
 * Create a new customer
 *
 * @param customerData Customer data
 * @returns Created customer
 */
export async function createCustomer(customerData: any) {
  return await shopify.customer.create(customerData);
}

/**
 * Update an existing customer
 *
 * @param customerId Customer ID
 * @param customerData Updated customer data
 * @returns Updated customer
 */
export async function updateCustomer(customerId: number, customerData: any) {
  return await shopify.customer.update(customerId, customerData);
}

/**
 * Search for customers
 *
 * @param query Search query
 * @returns Array of customers
 */
export async function searchCustomers(query: string) {
  return await shopify.customer.search({ query });
}

/**
 * Verify Shopify webhook signature
 *
 * @param data Raw webhook body
 * @param hmacHeader HMAC signature from header
 * @returns True if signature is valid
 */
export function verifyShopifyWebhook(data: string, hmacHeader: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', shopifyConfig.webhookSecret)
    .update(data, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}
