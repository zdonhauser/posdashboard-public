/**
 * Unit tests for Gift Card Service
 */

import * as giftcardService from '../../../services/giftcardService';
import { queryDB } from '../../../config/database';

// Mock the database module
jest.mock('../../../config/database', () => ({
  queryDB: jest.fn(),
}));

const mockQueryDB = queryDB as jest.MockedFunction<typeof queryDB>;

describe('Gift Card Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGiftCards', () => {
    it('should fetch all gift cards ordered by card_id', async () => {
      const mockGiftCards = [
        {
          card_id: 2,
          card_number: '9876543210',
          items: '{"item2": 20}',
          issue_timestamp: '2024-01-02',
        },
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issue_timestamp: '2024-01-01',
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockGiftCards } as any);

      const result = await giftcardService.getAllGiftCards();

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM gift_cards')
      );
      expect(result).toEqual(mockGiftCards);
    });

    it('should return empty array when no cards exist', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.getAllGiftCards();

      expect(result).toEqual([]);
    });
  });

  describe('getGiftCardsByOrder', () => {
    it('should search gift cards by order numbers', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issued_to: 'Order #12345',
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockGiftCards } as any);

      const result = await giftcardService.getGiftCardsByOrder(['12345']);

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('unnest($1::text[])'),
        [['12345']]
      );
      expect(result).toEqual(mockGiftCards);
    });

    it('should handle multiple order numbers', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          issued_to: 'Order #12345',
        },
        {
          card_id: 2,
          card_number: '9876543210',
          issued_to: 'Order #67890',
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockGiftCards } as any);

      const result = await giftcardService.getGiftCardsByOrder(['12345', '67890']);

      expect(result).toEqual(mockGiftCards);
    });

    it('should return empty array when no matches found', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.getGiftCardsByOrder(['99999']);

      expect(result).toEqual([]);
    });
  });

  describe('searchGiftCards', () => {
    it('should search for gift cards by card number', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issue_timestamp: '2024-01-01',
          redeem_timestamp: null,
          is_donation: false,
          issued_to: 'John Doe',
          notes: 'Test card',
          expiration: null,
          valid_starting: null,
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockGiftCards } as any);

      const result = await giftcardService.searchGiftCards('1234%');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM gift_cards'),
        ['1234%']
      );
      expect(result).toEqual(mockGiftCards);
    });

    it('should return empty array when no cards found', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.searchGiftCards('9999%');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        giftcardService.searchGiftCards('1234%')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getGiftCardsByDate', () => {
    it('should get redeemed gift cards for a specific date', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issue_timestamp: '2024-01-01',
          redeem_timestamp: '2024-01-15 10:30:00',
          is_donation: false,
        },
        {
          card_id: 2,
          card_number: '9876543210',
          items: '{"item2": 20}',
          issue_timestamp: '2024-01-01',
          redeem_timestamp: '2024-01-15 14:00:00',
          is_donation: true,
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockGiftCards } as any);

      const result = await giftcardService.getGiftCardsByDate('2024-01-15');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('WHERE redeem_timestamp >= $1 AND redeem_timestamp <= $2'),
        expect.arrayContaining([
          expect.any(Date),
          expect.any(Date),
        ])
      );
      expect(result).toEqual(mockGiftCards);
    });

    it('should return empty array when no redeems on date', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.getGiftCardsByDate('2024-01-15');

      expect(result).toEqual([]);
    });

    it('should handle invalid date format', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Invalid date'));

      await expect(
        giftcardService.getGiftCardsByDate('invalid-date')
      ).rejects.toThrow();
    });
  });

  describe('redeemGiftCard', () => {
    it('should redeem a gift card successfully', async () => {
      const mockRedeemed = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: '2024-01-01',
        redeem_timestamp: '2024-01-15 10:30:00',
        is_donation: false,
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockRedeemed] } as any);

      const result = await giftcardService.redeemGiftCard({
        card_id: 1,
        timestamp: '2024-01-15 10:30:00',
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gift_cards'),
        ['2024-01-15 10:30:00', 1]
      );
      expect(result).toEqual(mockRedeemed);
    });

    it('should return null when gift card not found', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.redeemGiftCard({
        card_id: 999,
        timestamp: '2024-01-15 10:30:00',
      });

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        giftcardService.redeemGiftCard({
          card_id: 1,
          timestamp: '2024-01-15 10:30:00',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('activateGiftCard', () => {
    it('should activate a new gift card with all fields', async () => {
      const mockNewCard = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: expect.any(String),
        redeem_timestamp: null,
        is_donation: true,
        issued_to: 'John Doe',
        notes: 'Birthday gift',
        expiration: '2025-01-01',
        valid_starting: '2024-01-01',
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockNewCard] } as any);

      const result = await giftcardService.activateGiftCard({
        card_number: '1234567890',
        items: '{"item1": 10}',
        is_donation: true,
        issued_to: 'John Doe',
        notes: 'Birthday gift',
        expiration: '2025-01-01',
        valid_starting: '2024-01-01',
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gift_cards'),
        [
          '1234567890',
          '{"item1": 10}',
          expect.any(String),
          true,
          'John Doe',
          'Birthday gift',
          '2025-01-01',
          '2024-01-01',
        ]
      );
      expect(result).toEqual(mockNewCard);
    });

    it('should activate a gift card with minimal required fields', async () => {
      const mockNewCard = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: expect.any(String),
        redeem_timestamp: null,
        is_donation: false,
        issued_to: null,
        notes: null,
        expiration: null,
        valid_starting: null,
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockNewCard] } as any);

      const result = await giftcardService.activateGiftCard({
        card_number: '1234567890',
        items: '{"item1": 10}',
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gift_cards'),
        [
          '1234567890',
          '{"item1": 10}',
          expect.any(String),
          false,
          null,
          null,
          null,
          null,
        ]
      );
      expect(result).toEqual(mockNewCard);
    });

    it('should handle database constraint errors', async () => {
      mockQueryDB.mockRejectedValueOnce(
        new Error('duplicate key value violates unique constraint')
      );

      await expect(
        giftcardService.activateGiftCard({
          card_number: '1234567890',
          items: '{"item1": 10}',
        })
      ).rejects.toThrow('duplicate key value');
    });
  });

  describe('bulkCreateGiftCards', () => {
    it('should create multiple gift cards at once', async () => {
      const mockNewCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: 'Unlimited Wristband',
          issued_to: 'John Doe',
        },
        {
          card_id: 2,
          card_number: '9876543210',
          items: 'Unlimited Wristband',
          issued_to: 'John Doe',
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockNewCards } as any);

      const result = await giftcardService.bulkCreateGiftCards({
        card_numbers: ['1234567890', '9876543210'],
        items: 'Unlimited Wristband',
        issued_to: 'John Doe',
        is_donation: false,
        notes: 'Bulk purchase',
        expiration: '2025-12-31',
        valid_starting: '2024-01-01',
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gift_cards'),
        expect.any(Array)
      );
      expect(result).toEqual(mockNewCards);
    });

    it('should create cards with minimal required fields', async () => {
      const mockNewCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: 'Unlimited Wristband',
        },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockNewCards } as any);

      const result = await giftcardService.bulkCreateGiftCards({
        card_numbers: ['1234567890'],
        items: 'Unlimited Wristband',
      });

      expect(result).toEqual(mockNewCards);
    });

    it('should handle database errors during bulk insert', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Bulk insert failed'));

      await expect(
        giftcardService.bulkCreateGiftCards({
          card_numbers: ['1234567890'],
          items: 'Unlimited Wristband',
        })
      ).rejects.toThrow('Bulk insert failed');
    });
  });

  describe('updateGiftCard', () => {
    it('should update a gift card successfully', async () => {
      const mockUpdatedCard = {
        card_id: 1,
        card_number: '1234567890',
        items: 'Updated Items',
        notes: 'Updated notes',
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockUpdatedCard] } as any);

      const result = await giftcardService.updateGiftCard('1', {
        items: 'Updated Items',
        notes: 'Updated notes',
      });

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gift_cards'),
        expect.arrayContaining(['Updated Items', 'Updated notes', '1'])
      );
      expect(result).toEqual(mockUpdatedCard);
    });

    it('should return null when gift card not found', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      const result = await giftcardService.updateGiftCard('999', {
        items: 'Updated Items',
      });

      expect(result).toBeNull();
    });

    it('should update only provided fields', async () => {
      const mockUpdatedCard = {
        card_id: 1,
        card_number: '1234567890',
        redeem_timestamp: '2024-01-15 10:30:00',
      };

      mockQueryDB.mockResolvedValueOnce({ rows: [mockUpdatedCard] } as any);

      const result = await giftcardService.updateGiftCard('1', {
        redeem_timestamp: '2024-01-15 10:30:00',
      });

      expect(result).toEqual(mockUpdatedCard);
    });

    it('should handle database errors', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        giftcardService.updateGiftCard('1', { items: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteGiftCard', () => {
    it('should delete a gift card successfully', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      await giftcardService.deleteGiftCard('1');

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM gift_cards'),
        ['1']
      );
    });

    it('should handle deleting non-existent card', async () => {
      mockQueryDB.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        giftcardService.deleteGiftCard('999')
      ).resolves.not.toThrow();
    });

    it('should handle database errors', async () => {
      mockQueryDB.mockRejectedValueOnce(new Error('Database error'));

      await expect(giftcardService.deleteGiftCard('1')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
