/**
 * API Request and Response Type Definitions
 *
 * This file contains TypeScript interfaces for API request bodies,
 * response payloads, query parameters, and common API patterns.
 */

import {
  Employee,
  ClockEntry,
  Membership,
  GiftCard,
  Customer,
  Transaction,
  PLUItem,
  KDSOrder,
  Discount,
} from './database';

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Date range query parameters
 */
export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
}

/**
 * Search query parameters
 */
export interface SearchParams {
  query: string;
  limit?: number;
}

// ============================================================================
// Employee API Types
// ============================================================================

export interface EmployeeCreateRequest {
  code: string;
  name: string;
  role: string;
  hourly_rate?: number;
}

export interface EmployeeUpdateRequest {
  name?: string;
  role?: string;
  hourly_rate?: number;
  active?: boolean;
}

export interface EmployeeClockRequest {
  action: 'in' | 'out';
  timestamp?: Date;
}

export interface ClockEntryUpdateRequest {
  clock_in?: Date;
  clock_out?: Date;
  duration?: number;
}

export interface RecurringEntryRequest {
  employee_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface EmployeeSearchResponse {
  employees: Employee[];
  total: number;
}

// ============================================================================
// Membership API Types
// ============================================================================

export interface MembershipCreateRequest {
  membership_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  membership_type: string;
  start_date: string;
  end_date?: string;
}

export interface MembershipUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  membership_type?: string;
  status?: string;
  end_date?: string;
}

export interface CheckinRequest {
  membership_id: number;
  visit_type: string;
}

export interface AttendanceRequest {
  membership_id: number;
  event_date: string;
  event_name: string;
  attended: boolean;
}

export interface MembershipSearchResponse {
  memberships: Membership[];
  total: number;
}

// ============================================================================
// Gift Card API Types
// ============================================================================

export interface GiftCardCreateRequest {
  card_id: string;
  initial_balance: number;
  order_id?: string;
}

export interface GiftCardUpdateRequest {
  balance?: number;
  status?: string;
}

export interface GiftCardRedeemRequest {
  card_id: string;
  amount: number;
}

export interface GiftCardActivateRequest {
  card_id: string;
}

export interface GiftCardSearchResponse {
  gift_cards: GiftCard[];
  total: number;
}

// ============================================================================
// Order API Types
// ============================================================================

export interface OrderSearchRequest {
  query?: string;
  order_id?: string;
  customer_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface OrderCreateRequest {
  line_items: Array<{
    variant_id: string;
    quantity: number;
    price?: number;
  }>;
  customer?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  financial_status?: string;
  fulfillment_status?: string;
  note?: string;
  tags?: string;
  discount_codes?: Array<{
    code: string;
    amount?: string;
    type?: string;
  }>;
}

export interface OrderUpdateRequest {
  note?: string;
  tags?: string;
  financial_status?: string;
}

export interface OrderFulfillmentRequest {
  order_id: string;
  location_id?: string;
  tracking_number?: string;
  tracking_company?: string;
  notify_customer?: boolean;
}

export interface OrderCancelRequest {
  order_id: string;
  reason?: string;
  refund?: boolean;
  restock?: boolean;
}

// ============================================================================
// Customer API Types
// ============================================================================

export interface CustomerCreateRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface CustomerUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface StoreCreditUpdateRequest {
  amount: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string;
}

export interface CustomerSearchResponse {
  customers: Customer[];
  total: number;
}

// ============================================================================
// Transaction API Types
// ============================================================================

export interface TransactionFetchRequest {
  start_date?: string;
  end_date?: string;
  status?: string;
  gateway?: string;
}

export interface TransactionSettleRequest {
  transaction_ids: string[];
}

export interface TenderTransactionRequest {
  transaction_type: 'sale' | 'refund' | 'no_sale' | 'paid_in' | 'paid_out';
  amount: number;
  tender_type: string;
  register_id?: string;
  employee_id?: number;
  notes?: string;
}

export interface TenderCountRequest {
  register_id: string;
  employee_id: number;
  cash_count: number;
  card_count: number;
  other_count: number;
  expected_total: number;
  actual_total: number;
  variance: number;
  notes?: string;
}

// ============================================================================
// KDS API Types
// ============================================================================

export interface KDSOrderCreateRequest {
  order_number: string;
  order_type: 'dine_in' | 'takeout' | 'delivery';
  items: Array<{
    item_name: string;
    quantity: number;
    modifiers?: string;
    special_instructions?: string;
  }>;
}

export interface KDSItemStatusUpdateRequest {
  status: 'pending' | 'in_progress' | 'completed';
}

export interface KDSOrderStatusUpdateRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// ============================================================================
// Product/Shopify API Types
// ============================================================================

export interface ProductSearchRequest {
  query?: string;
  sku?: string;
  collection_id?: string;
  limit?: number;
}

export interface InventoryUpdateRequest {
  variant_id: string;
  location_id?: string;
  available: number;
}

export interface InventoryAdjustRequest {
  variant_id: string;
  location_id?: string;
  adjustment: number;
  reason?: string;
}

// ============================================================================
// POS/PLU API Types
// ============================================================================

export interface PLUItemUpdateRequest {
  name?: string;
  price?: number;
  category?: string;
  tab?: string;
  modclasses?: string;
  active?: boolean;
}

export interface PLUModClassUpdateRequest {
  modclasses: string;
}

// ============================================================================
// Party Booking API Types
// ============================================================================

export interface PartyDateResponse {
  available_dates: string[];
}

export interface PartyTimeResponse {
  available_times: Array<{
    time: string;
    slots_available: number;
  }>;
}

export interface PartyInfoResponse {
  id: string;
  date: string;
  time: string;
  party_size: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  status: string;
}

// ============================================================================
// Authentication API Types
// ============================================================================

export interface DeviceValidationRequest {
  device_id: string;
  device_name?: string;
}

export interface PasscodeVerificationRequest {
  passcode: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    name: string;
    role: string;
  };
  message?: string;
}
