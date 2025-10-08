/**
 * Mock data generators for testing
 *
 * Functions to generate realistic test data for various entities.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a mock employee
 */
export function mockEmployee(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    employee_code: Math.floor(1000 + Math.random() * 9000).toString(),
    first_name: 'Test',
    last_name: 'Employee',
    email: `test.employee.${Date.now()}@example.com`,
    phone: '555-0100',
    role: 'staff',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock membership
 */
export function mockMembership(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    membership_number: `M${Math.floor(10000 + Math.random() * 90000)}`,
    first_name: 'Test',
    last_name: 'Member',
    email: `test.member.${Date.now()}@example.com`,
    phone: '555-0200',
    status: 'active',
    start_date: new Date(),
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock gift card
 */
export function mockGiftCard(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    card_number: `GC${Math.floor(100000 + Math.random() * 900000)}`,
    initial_balance: 50.00,
    current_balance: 50.00,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock order
 */
export function mockOrder(overrides?: Partial<any>) {
  const orderId = Math.floor(1000 + Math.random() * 9000);
  return {
    id: uuidv4(),
    order_id: orderId.toString(),
    shopify_order_id: `gid://shopify/Order/${orderId}`,
    customer_id: uuidv4(),
    total: 100.00,
    subtotal: 90.00,
    tax: 10.00,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock customer
 */
export function mockCustomer(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    shopify_customer_id: `gid://shopify/Customer/${Math.floor(1000 + Math.random() * 9000)}`,
    first_name: 'Test',
    last_name: 'Customer',
    email: `test.customer.${Date.now()}@example.com`,
    phone: '555-0300',
    store_credit: 0.00,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock transaction
 */
export function mockTransaction(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    order_id: uuidv4(),
    amount: 50.00,
    payment_method: 'credit_card',
    status: 'completed',
    transaction_date: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock product/PLU item
 */
export function mockPLUItem(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    plu: Math.floor(1000 + Math.random() * 9000).toString(),
    name: 'Test Product',
    price: 10.00,
    category: 'food',
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate a mock KDS order
 */
export function mockKDSOrder(overrides?: Partial<any>) {
  return {
    id: uuidv4(),
    order_number: Math.floor(100 + Math.random() * 900),
    items: [],
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

/**
 * Generate multiple instances of mock data
 */
export function mockMany<T>(generator: (overrides?: Partial<T>) => T, count: number): T[] {
  return Array.from({ length: count }, () => generator());
}
