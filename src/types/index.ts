/**
 * Type definitions index
 *
 * Central export point for all type definitions used throughout
 * the POS Dashboard application.
 */

// Database types
export * from './database';

// API types
export * from './api';

// External service types
export * from './stripe';
export * from './shopify';
export * from './google-drive';
export * from './socket';

// Type guards for runtime type checking
import {
  Employee,
  Membership,
  GiftCard,
  Customer,
  Transaction,
  PLUItem,
  KDSOrder,
  Order,
  LineItem,
} from './database';

/**
 * Type guard to check if an object is a valid Employee
 */
export function isEmployee(obj: any): obj is Employee {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.code === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.active === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid Membership
 */
export function isMembership(obj: any): obj is Membership {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.membership_number === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.membership_type === 'string' &&
    typeof obj.status === 'string'
  );
}

/**
 * Type guard to check if an object is a valid GiftCard
 */
export function isGiftCard(obj: any): obj is GiftCard {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.card_id === 'string' &&
    typeof obj.balance === 'number' &&
    typeof obj.initial_balance === 'number' &&
    typeof obj.status === 'string'
  );
}

/**
 * Type guard to check if an object is a valid Customer
 */
export function isCustomer(obj: any): obj is Customer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.store_credit === 'number'
  );
}

/**
 * Type guard to check if an object is a valid Transaction
 */
export function isTransaction(obj: any): obj is Transaction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.order_id === 'string' &&
    typeof obj.kind === 'string' &&
    typeof obj.gateway === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.currency === 'string'
  );
}

/**
 * Type guard to check if an object is a valid PLUItem
 */
export function isPLUItem(obj: any): obj is PLUItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.plu_code === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.active === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid KDSOrder
 */
export function isKDSOrder(obj: any): obj is KDSOrder {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.order_number === 'string' &&
    Array.isArray(obj.items) &&
    ['pending', 'in_progress', 'completed', 'cancelled'].includes(obj.status) &&
    ['dine_in', 'takeout', 'delivery'].includes(obj.order_type)
  );
}

/**
 * Type guard to check if an object is a valid Order
 */
export function isOrder(obj: any): obj is Order {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.line_items) &&
    Array.isArray(obj.refunds) &&
    typeof obj.updated_at === 'string'
  );
}

/**
 * Type guard to check if an object is a valid LineItem
 */
export function isLineItem(obj: any): obj is LineItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.id === 'string' &&
    typeof obj.sku === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.quantity === 'number'
  );
}

/**
 * Helper to validate array of type T using type guard
 */
export function isArrayOf<T>(
  arr: any,
  typeGuard: (item: any) => item is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(typeGuard);
}
