/**
 * Shopify API Type Definitions
 *
 * This file contains TypeScript interfaces for Shopify-specific
 * operations, webhooks, and product/order management.
 */

/**
 * Shopify Product
 */
export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string | null;
  template_suffix: string | null;
  status: 'active' | 'archived' | 'draft';
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyProductOption[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
}

/**
 * Shopify Product Variant
 */
export interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  image_id: string | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: string;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

/**
 * Shopify Product Option
 */
export interface ShopifyProductOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

/**
 * Shopify Image
 */
export interface ShopifyImage {
  id: string;
  product_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: string[];
  admin_graphql_api_id: string;
}

/**
 * Shopify Order
 */
export interface ShopifyOrder {
  id: string;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cart_token: string | null;
  checkout_id: number | null;
  checkout_token: string | null;
  closed_at: string | null;
  confirmed: boolean;
  contact_email: string | null;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_total_discounts: string;
  current_total_price: string;
  current_total_tax: string;
  customer_locale: string | null;
  device_id: number | null;
  discount_codes: ShopifyDiscountCode[];
  email: string;
  estimated_taxes: boolean;
  financial_status: string;
  fulfillment_status: string | null;
  gateway: string;
  landing_site: string | null;
  landing_site_ref: string | null;
  location_id: string | null;
  name: string;
  note: string | null;
  note_attributes: any[];
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_duties_set: any | null;
  payment_gateway_names: string[];
  phone: string | null;
  presentment_currency: string;
  processed_at: string;
  processing_method: string;
  reference: string | null;
  referring_site: string | null;
  source_identifier: string | null;
  source_name: string;
  source_url: string | null;
  subtotal_price: string;
  tags: string;
  tax_lines: ShopifyTaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_line_items_price: string;
  total_outstanding: string;
  total_price: string;
  total_price_usd: string;
  total_shipping_price_set: any;
  total_tax: string;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number | null;
  billing_address: ShopifyAddress | null;
  customer: ShopifyCustomer;
  discount_applications: any[];
  fulfillments: ShopifyFulfillment[];
  line_items: ShopifyLineItem[];
  payment_details: any | null;
  refunds: ShopifyRefund[];
  shipping_address: ShopifyAddress | null;
  shipping_lines: ShopifyShippingLine[];
}

/**
 * Shopify Line Item
 */
export interface ShopifyLineItem {
  id: string;
  admin_graphql_api_id: string;
  fulfillable_quantity: number;
  fulfillment_service: string;
  fulfillment_status: string | null;
  gift_card: boolean;
  grams: number;
  name: string;
  price: string;
  price_set: any;
  product_exists: boolean;
  product_id: string | null;
  properties: any[];
  quantity: number;
  requires_shipping: boolean;
  sku: string;
  taxable: boolean;
  title: string;
  total_discount: string;
  total_discount_set: any;
  variant_id: string | null;
  variant_inventory_management: string | null;
  variant_title: string | null;
  vendor: string | null;
  tax_lines: ShopifyTaxLine[];
  duties: any[];
  discount_allocations: any[];
}

/**
 * Shopify Customer
 */
export interface ShopifyCustomer {
  id: string;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: string | null;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  phone: string | null;
  tags: string;
  last_order_name: string | null;
  currency: string;
  accepts_marketing_updated_at: string;
  marketing_opt_in_level: string | null;
  tax_exemptions: any[];
  admin_graphql_api_id: string;
  default_address: ShopifyAddress;
}

/**
 * Shopify Address
 */
export interface ShopifyAddress {
  first_name: string;
  address1: string;
  phone: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  last_name: string;
  address2: string | null;
  company: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  country_code: string;
  province_code: string;
}

/**
 * Shopify Fulfillment
 */
export interface ShopifyFulfillment {
  id: string;
  admin_graphql_api_id: string;
  created_at: string;
  location_id: string;
  name: string;
  order_id: string;
  origin_address: any;
  receipt: any;
  service: string;
  shipment_status: string | null;
  status: string;
  tracking_company: string;
  tracking_number: string;
  tracking_numbers: string[];
  tracking_url: string;
  tracking_urls: string[];
  updated_at: string;
  line_items: ShopifyLineItem[];
}

/**
 * Shopify Refund
 */
export interface ShopifyRefund {
  id: string;
  admin_graphql_api_id: string;
  created_at: string;
  note: string | null;
  order_id: string;
  processed_at: string;
  restock: boolean;
  total_duties_set: any;
  user_id: number;
  order_adjustments: any[];
  transactions: any[];
  refund_line_items: ShopifyRefundLineItem[];
}

/**
 * Shopify Refund Line Item
 */
export interface ShopifyRefundLineItem {
  id: string;
  line_item_id: string;
  location_id: string | null;
  quantity: number;
  restock_type: string;
  subtotal: number;
  subtotal_set: any;
  total_tax: number;
  total_tax_set: any;
  line_item: ShopifyLineItem;
}

/**
 * Shopify Discount Code
 */
export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: string;
}

/**
 * Shopify Tax Line
 */
export interface ShopifyTaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: any;
  channel_liable: boolean;
}

/**
 * Shopify Shipping Line
 */
export interface ShopifyShippingLine {
  id: string;
  carrier_identifier: string | null;
  code: string;
  delivery_category: string | null;
  discounted_price: string;
  discounted_price_set: any;
  phone: string | null;
  price: string;
  price_set: any;
  requested_fulfillment_service_id: string | null;
  source: string;
  title: string;
  tax_lines: ShopifyTaxLine[];
  discount_allocations: any[];
}

/**
 * Shopify Collection
 */
export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  updated_at: string;
  body_html: string;
  published_at: string;
  sort_order: string;
  template_suffix: string | null;
  published_scope: string;
  admin_graphql_api_id: string;
}

/**
 * Shopify Metafield
 */
export interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  value_type: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_resource: string;
  type: string;
  admin_graphql_api_id: string;
}

/**
 * Shopify Inventory Level
 */
export interface ShopifyInventoryLevel {
  inventory_item_id: string;
  location_id: string;
  available: number;
  updated_at: string;
}

/**
 * Shopify Webhook Topic Types
 */
export type ShopifyWebhookTopic =
  | 'orders/create'
  | 'orders/updated'
  | 'orders/delete'
  | 'orders/paid'
  | 'orders/cancelled'
  | 'orders/fulfilled'
  | 'orders/partially_fulfilled'
  | 'products/create'
  | 'products/update'
  | 'products/delete'
  | 'customers/create'
  | 'customers/update'
  | 'customers/delete'
  | 'inventory_levels/update'
  | 'fulfillments/create'
  | 'fulfillments/update'
  | 'refunds/create';
