/**
 * Type Guards Unit Tests
 *
 * This file contains unit tests for all type guard functions
 * to ensure proper runtime type checking.
 */

import {
  isEmployee,
  isMembership,
  isGiftCard,
  isCustomer,
  isTransaction,
  isPLUItem,
  isKDSOrder,
  isOrder,
  isLineItem,
  isArrayOf,
  Employee,
  Membership,
  GiftCard,
  Customer,
  Transaction,
  PLUItem,
  KDSOrder,
  Order,
  LineItem,
} from '../../types';

describe('Type Guards', () => {
  describe('isEmployee', () => {
    it('should return true for valid Employee object', () => {
      const employee: Employee = {
        id: 1,
        code: 'EMP001',
        name: 'John Doe',
        role: 'cashier',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isEmployee(employee)).toBe(true);
    });

    it('should return false for invalid Employee object', () => {
      const invalidEmployee = {
        id: 1,
        code: 'EMP001',
        name: 'John Doe',
        // missing role
        active: true,
      };

      expect(isEmployee(invalidEmployee)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isEmployee(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEmployee(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isEmployee('string')).toBe(false);
      expect(isEmployee(123)).toBe(false);
      expect(isEmployee([])).toBe(false);
    });
  });

  describe('isMembership', () => {
    it('should return true for valid Membership object', () => {
      const membership: Membership = {
        id: 1,
        membership_number: 'MEM12345',
        first_name: 'Jane',
        last_name: 'Smith',
        membership_type: 'gold',
        status: 'active',
        start_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isMembership(membership)).toBe(true);
    });

    it('should return false for invalid Membership object', () => {
      const invalidMembership = {
        id: 1,
        membership_number: 'MEM12345',
        first_name: 'Jane',
        // missing last_name, membership_type, status
      };

      expect(isMembership(invalidMembership)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isMembership(null)).toBe(false);
      expect(isMembership(undefined)).toBe(false);
    });
  });

  describe('isGiftCard', () => {
    it('should return true for valid GiftCard object', () => {
      const giftCard: GiftCard = {
        id: 1,
        card_id: 'GC123456',
        balance: 50.0,
        initial_balance: 100.0,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isGiftCard(giftCard)).toBe(true);
    });

    it('should return false for invalid GiftCard object', () => {
      const invalidGiftCard = {
        id: 1,
        card_id: 'GC123456',
        balance: 50.0,
        // missing initial_balance and status
      };

      expect(isGiftCard(invalidGiftCard)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isGiftCard(null)).toBe(false);
      expect(isGiftCard(undefined)).toBe(false);
    });
  });

  describe('isCustomer', () => {
    it('should return true for valid Customer object', () => {
      const customer: Customer = {
        id: 1,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        store_credit: 25.0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isCustomer(customer)).toBe(true);
    });

    it('should return false for invalid Customer object', () => {
      const invalidCustomer = {
        id: 1,
        first_name: 'Alice',
        // missing last_name and store_credit
      };

      expect(isCustomer(invalidCustomer)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isCustomer(null)).toBe(false);
      expect(isCustomer(undefined)).toBe(false);
    });
  });

  describe('isTransaction', () => {
    it('should return true for valid Transaction object', () => {
      const transaction: Transaction = {
        id: 'txn_123',
        order_id: 'order_456',
        kind: 'sale',
        gateway: 'stripe',
        status: 'success',
        amount: 100.0,
        currency: 'USD',
        test: false,
        created_at: new Date(),
      };

      expect(isTransaction(transaction)).toBe(true);
    });

    it('should return false for invalid Transaction object', () => {
      const invalidTransaction = {
        id: 'txn_123',
        order_id: 'order_456',
        // missing required fields
      };

      expect(isTransaction(invalidTransaction)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isTransaction(null)).toBe(false);
      expect(isTransaction(undefined)).toBe(false);
    });
  });

  describe('isPLUItem', () => {
    it('should return true for valid PLUItem object', () => {
      const pluItem: PLUItem = {
        id: 1,
        plu_code: 'PLU001',
        name: 'Pizza',
        price: 12.99,
        category: 'food',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isPLUItem(pluItem)).toBe(true);
    });

    it('should return false for invalid PLUItem object', () => {
      const invalidPLUItem = {
        id: 1,
        plu_code: 'PLU001',
        name: 'Pizza',
        // missing price, category, active
      };

      expect(isPLUItem(invalidPLUItem)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isPLUItem(null)).toBe(false);
      expect(isPLUItem(undefined)).toBe(false);
    });
  });

  describe('isKDSOrder', () => {
    it('should return true for valid KDSOrder object', () => {
      const kdsOrder: KDSOrder = {
        id: 1,
        order_number: 'KDS001',
        items: [],
        status: 'pending',
        order_type: 'dine_in',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(isKDSOrder(kdsOrder)).toBe(true);
    });

    it('should accept all valid status values', () => {
      const statuses: Array<'pending' | 'in_progress' | 'completed' | 'cancelled'> = [
        'pending',
        'in_progress',
        'completed',
        'cancelled',
      ];

      statuses.forEach((status) => {
        const kdsOrder: KDSOrder = {
          id: 1,
          order_number: 'KDS001',
          items: [],
          status,
          order_type: 'dine_in',
          created_at: new Date(),
          updated_at: new Date(),
        };

        expect(isKDSOrder(kdsOrder)).toBe(true);
      });
    });

    it('should accept all valid order_type values', () => {
      const orderTypes: Array<'dine_in' | 'takeout' | 'delivery'> = [
        'dine_in',
        'takeout',
        'delivery',
      ];

      orderTypes.forEach((order_type) => {
        const kdsOrder: KDSOrder = {
          id: 1,
          order_number: 'KDS001',
          items: [],
          status: 'pending',
          order_type,
          created_at: new Date(),
          updated_at: new Date(),
        };

        expect(isKDSOrder(kdsOrder)).toBe(true);
      });
    });

    it('should return false for invalid status', () => {
      const kdsOrder = {
        id: 1,
        order_number: 'KDS001',
        items: [],
        status: 'invalid_status',
        order_type: 'dine_in',
      };

      expect(isKDSOrder(kdsOrder)).toBe(false);
    });

    it('should return false for invalid order_type', () => {
      const kdsOrder = {
        id: 1,
        order_number: 'KDS001',
        items: [],
        status: 'pending',
        order_type: 'invalid_type',
      };

      expect(isKDSOrder(kdsOrder)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isKDSOrder(null)).toBe(false);
      expect(isKDSOrder(undefined)).toBe(false);
    });
  });

  describe('isOrder', () => {
    it('should return true for valid Order object', () => {
      const order: Order = {
        id: 'order_123',
        line_items: [],
        refunds: [],
        updated_at: '2025-01-01T00:00:00Z',
      };

      expect(isOrder(order)).toBe(true);
    });

    it('should return false for invalid Order object', () => {
      const invalidOrder = {
        id: 'order_123',
        // missing line_items, refunds, updated_at
      };

      expect(isOrder(invalidOrder)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isOrder(null)).toBe(false);
      expect(isOrder(undefined)).toBe(false);
    });
  });

  describe('isLineItem', () => {
    it('should return true for valid LineItem object', () => {
      const lineItem: LineItem = {
        name: 'Product Name',
        id: 'li_123',
        sku: 'SKU123',
        price: 29.99,
        quantity: 2,
      };

      expect(isLineItem(lineItem)).toBe(true);
    });

    it('should return false for invalid LineItem object', () => {
      const invalidLineItem = {
        name: 'Product Name',
        id: 'li_123',
        // missing sku, price, quantity
      };

      expect(isLineItem(invalidLineItem)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isLineItem(null)).toBe(false);
      expect(isLineItem(undefined)).toBe(false);
    });
  });

  describe('isArrayOf', () => {
    it('should return true for array of valid types', () => {
      const employees: Employee[] = [
        {
          id: 1,
          code: 'EMP001',
          name: 'John Doe',
          role: 'cashier',
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          code: 'EMP002',
          name: 'Jane Smith',
          role: 'manager',
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      expect(isArrayOf(employees, isEmployee)).toBe(true);
    });

    it('should return false for array with mixed types', () => {
      const mixed = [
        {
          id: 1,
          code: 'EMP001',
          name: 'John Doe',
          role: 'cashier',
          active: true,
        },
        {
          id: 2,
          // missing required fields
        },
      ];

      expect(isArrayOf(mixed, isEmployee)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(isArrayOf([], isEmployee)).toBe(true);
    });

    it('should return false for non-array', () => {
      expect(isArrayOf('not an array', isEmployee)).toBe(false);
      expect(isArrayOf(null, isEmployee)).toBe(false);
      expect(isArrayOf(undefined, isEmployee)).toBe(false);
    });
  });
});
