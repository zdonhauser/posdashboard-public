/**
 * Database Type Definitions
 *
 * This file contains TypeScript interfaces and types for database entities
 * and related data structures used throughout the POS Dashboard application.
 */

import { Request } from 'express';
import { File } from 'multer';

/**
 * Extended Express Request interface that includes Multer file uploads
 */
export interface MulterRequest extends Request {
  file: File;
  body: {
    membership_number: string;
    [key: string]: any;
  };
}

/**
 * Shopify Order interface
 */
export interface Order {
  id: string;
  line_items: LineItem[];
  refunds: Refund[];
  updated_at: string;
}

/**
 * Shopify Order Line Item
 */
export interface LineItem {
  name: string;
  id: string;
  sku: string;
  price: number;
  quantity: number;
}

/**
 * Shopify Refund
 */
export interface Refund {
  refund_line_items: RefundItem[];
}

/**
 * Shopify Refund Line Item
 */
export interface RefundItem {
  line_item: {
    id: string;
  };
  quantity: number;
}

/**
 * Internal Item representation (used for processing orders)
 */
export type Item = {
  name: string;
  id: string;
  sku: string;
  price: number;
  quantity: number;
  totalAmount: number;
  category: string;
};

/**
 * Employee database row
 */
export interface Employee {
  id: number;
  code: string;
  name: string;
  role: string;
  active: boolean;
  hourly_rate?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Employee clock entry
 */
export interface ClockEntry {
  id: number;
  employee_id: number;
  clock_in: Date;
  clock_out?: Date;
  duration?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Recurring entry (scheduled shifts)
 */
export interface RecurringEntry {
  id: number;
  employee_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Membership database row
 */
export interface Membership {
  id: number;
  membership_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  membership_type: string;
  status: string;
  start_date: Date;
  end_date?: Date;
  photo_url?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Membership visit/check-in
 */
export interface Visit {
  id: number;
  membership_id: number;
  visit_date: Date;
  visit_type: string;
  created_at: Date;
}

/**
 * Attendance record (for classes/events)
 */
export interface Attendance {
  id: number;
  membership_id: number;
  event_date: Date;
  event_name: string;
  attended: boolean;
  created_at: Date;
}

/**
 * Gift card database row
 */
export interface GiftCard {
  id: number;
  card_id: string;
  balance: number;
  initial_balance: number;
  status: string;
  order_id?: string;
  activated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Customer database row
 */
export interface Customer {
  id: number;
  shopify_customer_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  store_credit: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Transaction database row
 */
export interface Transaction {
  id: string;
  order_id: string;
  kind: string;
  gateway: string;
  status: string;
  message?: string;
  created_at: Date;
  test: boolean;
  authorization?: string;
  location_id?: string;
  user_id?: string;
  parent_id?: string;
  processed_at?: Date;
  device_id?: string;
  error_code?: string;
  source_name?: string;
  amount: number;
  currency: string;
  payment_id?: string;
  manual_payment_gateway?: boolean;
  admin_graphql_api_id?: string;
  webhook?: any;
}

/**
 * POS PLU (Price Look-Up) Item
 */
export interface PLUItem {
  id: number;
  plu_code: string;
  name: string;
  price: number;
  category: string;
  tab?: string;
  modclasses?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * POS Modifier
 */
export interface Modifier {
  id: number;
  name: string;
  price: number;
  modclass: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * KDS (Kitchen Display System) Order
 */
export interface KDSOrder {
  id: number;
  order_number: string;
  items: KDSItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  order_type: 'dine_in' | 'takeout' | 'delivery';
  created_at: Date;
  updated_at: Date;
}

/**
 * KDS Order Item
 */
export interface KDSItem {
  id: number;
  kds_order_id: number;
  item_name: string;
  quantity: number;
  modifiers?: string;
  special_instructions?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: Date;
  updated_at: Date;
}

/**
 * Tender transaction (cash register operations)
 */
export interface TenderTransaction {
  id: number;
  transaction_type: 'sale' | 'refund' | 'no_sale' | 'paid_in' | 'paid_out';
  amount: number;
  tender_type: string;
  register_id?: string;
  employee_id?: number;
  notes?: string;
  created_at: Date;
}

/**
 * Discount/promotion
 */
export interface Discount {
  id: number;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  description?: string;
  active: boolean;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}
