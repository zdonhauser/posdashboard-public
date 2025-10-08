/**
 * Unit tests for KDS Service
 */

import * as kdsService from '../../../services/kdsService';
import { queryDB } from '../../../config/database';

// Mock the database module
jest.mock('../../../config/database', () => ({
  queryDB: jest.fn(),
}));

const mockQueryDB = queryDB as jest.MockedFunction<typeof queryDB>;

describe('KDS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getKDSOrders', () => {
    it('should fetch all KDS orders when no status filter is provided', async () => {
      const mockOrders = [
        {
          id: 1,
          pos_order_id: 'ORDER-123',
          order_number: '1001',
          status: 'pending',
          front_released: false,
          is_fulfilled: false,
          name: 'Test Order',
          items: [],
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockOrders } as any);

      const result = await kdsService.getKDSOrders();

      expect(mockQueryDB).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });

    it('should filter KDS orders by status', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'ready',
          items: [],
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockOrders } as any);

      const result = await kdsService.getKDSOrders('ready');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("WHERE (o.status = 'ready')")
      );
      expect(result).toEqual(mockOrders);
    });

    it('should order by specified field', async () => {
      const mockOrders = [
        {
          id: 2,
          created_at: '2024-01-02',
          items: [],
        },
        {
          id: 1,
          created_at: '2024-01-01',
          items: [],
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockOrders } as any);

      const result = await kdsService.getKDSOrders(undefined, undefined, 'created_at');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY o.created_at DESC')
      );
      expect(result).toEqual(mockOrders);
    });
  });

  describe('createKDSOrder', () => {
    it('should create a KDS order with items', async () => {
      const mockOrder: kdsService.KDSOrder = {
        pos_order_id: 'ORDER-123',
        order_number: '1001',
        status: 'pending',
        name: 'Test Order',
        items: [
          {
            item_name: 'Burger',
            quantity: 2,
            station: 'grill',
            special_instructions: 'No pickles',
          },
        ],
      };

      mockQueryDB
        .mockResolvedValueOnce({ rows: [{ id: 1 }] } as any) // Order insert
        .mockResolvedValueOnce({ rows: [] } as any); // Items insert

      const result = await kdsService.createKDSOrder(mockOrder);

      expect(mockQueryDB).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        kitchen_order_id: 1,
      });
    });

    it('should throw error when required fields are missing', async () => {
      const invalidOrder = {
        pos_order_id: 'ORDER-123',
        // Missing order_number
        items: [],
        status: 'pending',
      } as any;

      await expect(kdsService.createKDSOrder(invalidOrder)).rejects.toThrow(
        'Invalid payload'
      );

      expect(mockQueryDB).not.toHaveBeenCalled();
    });

    it('should create order without items', async () => {
      const mockOrder: kdsService.KDSOrder = {
        pos_order_id: 'ORDER-123',
        order_number: '1001',
        status: 'pending',
        items: [],
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [{ id: 1 }] } as any);

      const result = await kdsService.createKDSOrder(mockOrder);

      expect(mockQueryDB).toHaveBeenCalledTimes(1); // Only order insert, no items
      expect(result.kitchen_order_id).toBe(1);
    });
  });

  describe('updateKDSItemStatus', () => {
    it('should mark item as prepared', async () => {
      const mockResult = {
        id: 1,
        prepared_quantity: 2,
        fulfilled_quantity: 0,
        quantity: 2,
      };

      mockQueryDB.mockResolvedValueOnce({
        rows: [mockResult],
        rowCount: 1,
      } as any);

      const result = await kdsService.updateKDSItemStatus('1', 'mark-prepared');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE kitchen_order_items'),
        ['1', 'mark-prepared']
      );
      expect(result.success).toBe(true);
      expect(result.item).toEqual([mockResult]);
    });

    it('should mark item as fulfilled', async () => {
      const mockResult = {
        id: 1,
        prepared_quantity: 2,
        fulfilled_quantity: 2,
        quantity: 2,
      };

      mockQueryDB.mockResolvedValueOnce({
        rows: [mockResult],
        rowCount: 1,
      } as any);

      const result = await kdsService.updateKDSItemStatus('1', 'mark-fulfilled');

      expect(result.success).toBe(true);
    });

    it('should throw error for invalid status', async () => {
      await expect(
        kdsService.updateKDSItemStatus('1', 'invalid-status')
      ).rejects.toThrow('Invalid status');

      expect(mockQueryDB).not.toHaveBeenCalled();
    });

    it('should throw error when item does not exist', async () => {
      mockQueryDB.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await expect(
        kdsService.updateKDSItemStatus('999', 'mark-prepared')
      ).rejects.toThrow('does not exist');
    });
  });

  describe('updateKDSOrderStatus', () => {
    it('should mark order as ready with item updates', async () => {
      const mockOrder = {
        id: 1,
        status: 'ready',
        pos_order_id: 'ORDER-123',
      };

      mockQueryDB
        .mockResolvedValueOnce({ rows: [] } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [] } as any) // Item update
        .mockResolvedValueOnce({
          rows: [mockOrder],
          rowCount: 1,
        } as any) // Order update
        .mockResolvedValueOnce({ rows: [] } as any); // COMMIT

      const result = await kdsService.updateKDSOrderStatus('1', 'ready', false);

      expect(mockQueryDB).toHaveBeenCalledWith('BEGIN');
      expect(mockQueryDB).toHaveBeenCalledWith('COMMIT');
      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
    });

    it('should skip item updates when skipItemUpdate is true', async () => {
      const mockOrder = {
        id: 1,
        status: 'ready',
      };

      mockQueryDB
        .mockResolvedValueOnce({ rows: [] } as any) // BEGIN
        .mockResolvedValueOnce({
          rows: [mockOrder],
          rowCount: 1,
        } as any) // Order update (no item update)
        .mockResolvedValueOnce({ rows: [] } as any); // COMMIT

      const result = await kdsService.updateKDSOrderStatus('1', 'ready', true);

      expect(result.success).toBe(true);
      // Should only call queryDB 3 times: BEGIN, ORDER UPDATE, COMMIT (no item update)
      expect(mockQueryDB).toHaveBeenCalledTimes(3);
    });

    it('should throw error for invalid status', async () => {
      await expect(
        kdsService.updateKDSOrderStatus('1', 'invalid-status')
      ).rejects.toThrow('Invalid status');
    });

    it('should rollback on order not found', async () => {
      mockQueryDB
        .mockResolvedValueOnce({ rows: [] } as any) // BEGIN
        .mockResolvedValueOnce({ rows: [] } as any) // Item update (for 'ready' status)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any) // Order update fails
        .mockResolvedValueOnce({ rows: [] } as any); // ROLLBACK

      await expect(
        kdsService.updateKDSOrderStatus('999', 'ready')
      ).rejects.toThrow('Order not found');

      expect(mockQueryDB).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should rollback on error', async () => {
      mockQueryDB
        .mockResolvedValueOnce({ rows: [] } as any) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ rows: [] } as any); // ROLLBACK

      await expect(
        kdsService.updateKDSOrderStatus('1', 'ready')
      ).rejects.toThrow('Database error');

      expect(mockQueryDB).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
