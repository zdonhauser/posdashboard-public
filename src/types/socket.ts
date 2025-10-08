/**
 * Socket.IO Event Type Definitions
 *
 * This file contains TypeScript interfaces for real-time
 * Socket.IO events used throughout the application.
 */

import {
  Order,
  Employee,
  Membership,
  GiftCard,
  Transaction,
  KDSOrder,
  KDSItem,
  PLUItem,
} from './database';

/**
 * Base Socket Event
 */
export interface SocketEvent<T = any> {
  timestamp: Date;
  data: T;
  source?: string;
}

// ============================================================================
// Order Events
// ============================================================================

/**
 * Order Created Event
 */
export interface OrderCreatedEvent extends SocketEvent<Order> {
  type: 'order:created';
}

/**
 * Order Updated Event
 */
export interface OrderUpdatedEvent extends SocketEvent<Order> {
  type: 'order:updated';
  changes?: Partial<Order>;
}

/**
 * Order Cancelled Event
 */
export interface OrderCancelledEvent extends SocketEvent {
  type: 'order:cancelled';
  orderId: string;
  reason?: string;
}

/**
 * Order Fulfilled Event
 */
export interface OrderFulfilledEvent extends SocketEvent {
  type: 'order:fulfilled';
  orderId: string;
  fulfillmentId: string;
}

// ============================================================================
// Payment Events
// ============================================================================

/**
 * Payment Processed Event
 */
export interface PaymentProcessedEvent extends SocketEvent<Transaction> {
  type: 'payment:processed';
}

/**
 * Payment Failed Event
 */
export interface PaymentFailedEvent extends SocketEvent {
  type: 'payment:failed';
  orderId: string;
  error: string;
}

/**
 * Refund Completed Event
 */
export interface RefundCompletedEvent extends SocketEvent {
  type: 'refund:completed';
  orderId: string;
  refundAmount: number;
}

// ============================================================================
// Inventory Events
// ============================================================================

/**
 * Inventory Updated Event
 */
export interface InventoryUpdatedEvent extends SocketEvent {
  type: 'inventory:updated';
  variantId: string;
  available: number;
  locationId?: string;
}

/**
 * Product Updated Event
 */
export interface ProductUpdatedEvent extends SocketEvent {
  type: 'product:updated';
  productId: string;
  changes?: any;
}

/**
 * Product Price Changed Event
 */
export interface ProductPriceChangedEvent extends SocketEvent {
  type: 'product:priceChanged';
  productId: string;
  variantId: string;
  oldPrice: number;
  newPrice: number;
}

// ============================================================================
// Employee Events
// ============================================================================

/**
 * Employee Clocked In Event
 */
export interface EmployeeClockedInEvent extends SocketEvent {
  type: 'employee:clockedIn';
  employeeId: number;
  employeeName: string;
  timestamp: Date;
}

/**
 * Employee Clocked Out Event
 */
export interface EmployeeClockedOutEvent extends SocketEvent {
  type: 'employee:clockedOut';
  employeeId: number;
  employeeName: string;
  timestamp: Date;
  duration: number;
}

/**
 * Employee Updated Event
 */
export interface EmployeeUpdatedEvent extends SocketEvent<Employee> {
  type: 'employee:updated';
}

// ============================================================================
// Membership Events
// ============================================================================

/**
 * Member Checked In Event
 */
export interface MemberCheckedInEvent extends SocketEvent {
  type: 'member:checkedIn';
  membershipId: number;
  membershipNumber: string;
  memberName: string;
  visitType: string;
}

/**
 * Member Updated Event
 */
export interface MemberUpdatedEvent extends SocketEvent<Membership> {
  type: 'member:updated';
}

// ============================================================================
// Gift Card Events
// ============================================================================

/**
 * Gift Card Activated Event
 */
export interface GiftCardActivatedEvent extends SocketEvent {
  type: 'giftCard:activated';
  cardId: string;
  initialBalance: number;
}

/**
 * Gift Card Redeemed Event
 */
export interface GiftCardRedeemedEvent extends SocketEvent {
  type: 'giftCard:redeemed';
  cardId: string;
  amountRedeemed: number;
  remainingBalance: number;
}

/**
 * Gift Card Updated Event
 */
export interface GiftCardUpdatedEvent extends SocketEvent<GiftCard> {
  type: 'giftCard:updated';
}

// ============================================================================
// KDS (Kitchen Display System) Events
// ============================================================================

/**
 * KDS Order Created Event
 */
export interface KDSOrderCreatedEvent extends SocketEvent<KDSOrder> {
  type: 'kds:orderCreated';
}

/**
 * KDS Order Updated Event
 */
export interface KDSOrderUpdatedEvent extends SocketEvent {
  type: 'kds:orderUpdated';
  orderId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * KDS Item Status Changed Event
 */
export interface KDSItemStatusChangedEvent extends SocketEvent {
  type: 'kds:itemStatusChanged';
  itemId: number;
  orderId: number;
  status: 'pending' | 'in_progress' | 'completed';
}

// ============================================================================
// Configuration Events
// ============================================================================

/**
 * Config Updated Event
 */
export interface ConfigUpdatedEvent extends SocketEvent {
  type: 'config:updated';
  configKey: string;
  configValue: any;
}

/**
 * Discount Activated Event
 */
export interface DiscountActivatedEvent extends SocketEvent {
  type: 'discount:activated';
  discountCode: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
}

/**
 * System Alert Event
 */
export interface SystemAlertEvent extends SocketEvent {
  type: 'system:alert';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
}

// ============================================================================
// Real-Time Data Events
// ============================================================================

/**
 * Sales Update Event (for dashboard)
 */
export interface SalesUpdateEvent extends SocketEvent {
  type: 'sales:update';
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

/**
 * Database Notification Event (PostgreSQL LISTEN/NOTIFY)
 */
export interface DatabaseNotificationEvent extends SocketEvent {
  type: 'db:notification';
  channel: string;
  payload: any;
}

// ============================================================================
// Union Types for Type Safety
// ============================================================================

/**
 * All possible Socket.IO events
 */
export type SocketEventType =
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderCancelledEvent
  | OrderFulfilledEvent
  | PaymentProcessedEvent
  | PaymentFailedEvent
  | RefundCompletedEvent
  | InventoryUpdatedEvent
  | ProductUpdatedEvent
  | ProductPriceChangedEvent
  | EmployeeClockedInEvent
  | EmployeeClockedOutEvent
  | EmployeeUpdatedEvent
  | MemberCheckedInEvent
  | MemberUpdatedEvent
  | GiftCardActivatedEvent
  | GiftCardRedeemedEvent
  | GiftCardUpdatedEvent
  | KDSOrderCreatedEvent
  | KDSOrderUpdatedEvent
  | KDSItemStatusChangedEvent
  | ConfigUpdatedEvent
  | DiscountActivatedEvent
  | SystemAlertEvent
  | SalesUpdateEvent
  | DatabaseNotificationEvent;

/**
 * Socket Event Names (for emitting/listening)
 */
export type SocketEventName =
  | 'order:created'
  | 'order:updated'
  | 'order:cancelled'
  | 'order:fulfilled'
  | 'payment:processed'
  | 'payment:failed'
  | 'refund:completed'
  | 'inventory:updated'
  | 'product:updated'
  | 'product:priceChanged'
  | 'employee:clockedIn'
  | 'employee:clockedOut'
  | 'employee:updated'
  | 'member:checkedIn'
  | 'member:updated'
  | 'giftCard:activated'
  | 'giftCard:redeemed'
  | 'giftCard:updated'
  | 'kds:orderCreated'
  | 'kds:orderUpdated'
  | 'kds:itemStatusChanged'
  | 'config:updated'
  | 'discount:activated'
  | 'system:alert'
  | 'sales:update'
  | 'db:notification';
