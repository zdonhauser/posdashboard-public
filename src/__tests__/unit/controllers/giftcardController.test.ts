/**
 * Unit tests for Gift Card Controller
 */

import { Request, Response } from 'express';
import * as giftcardController from '../../../controllers/giftcardController';
import * as giftcardService from '../../../services/giftcardService';

// Mock the service module
jest.mock('../../../services/giftcardService');

const mockGiftcardService = giftcardService as jest.Mocked<
  typeof giftcardService
>;

describe('Gift Card Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockSend = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      json: mockJson,
      send: mockSend,
      status: mockStatus,
    };
  });

  describe('getAll', () => {
    it('should get all gift cards successfully', async () => {
      const mockGiftCards = [
        {
          card_id: 2,
          card_number: '9876543210',
          items: '{"item2": 20}',
        },
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
        },
      ] as any;

      mockGiftcardService.getAllGiftCards.mockResolvedValueOnce(mockGiftCards);

      await giftcardController.getAll(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getAllGiftCards).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockGiftCards);
    });

    it('should handle service errors', async () => {
      mockGiftcardService.getAllGiftCards.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.getAll(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getByOrder', () => {
    it('should get gift cards by order numbers successfully', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          issued_to: 'Order #12345',
        },
      ] as any;

      mockRequest.query = { orderNumbers: ['12345'] };
      mockGiftcardService.getGiftCardsByOrder.mockResolvedValueOnce(mockGiftCards);

      await giftcardController.getByOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getGiftCardsByOrder).toHaveBeenCalledWith(['12345']);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockGiftCards);
    });

    it('should handle single order number as string', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          issued_to: 'Order #12345',
        },
      ] as any;

      mockRequest.query = { orderNumbers: '12345' };
      mockGiftcardService.getGiftCardsByOrder.mockResolvedValueOnce(mockGiftCards);

      await giftcardController.getByOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getGiftCardsByOrder).toHaveBeenCalledWith(['12345']);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockGiftCards);
    });

    it('should return 400 if orderNumbers is missing', async () => {
      mockRequest.query = {};

      await giftcardController.getByOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getGiftCardsByOrder).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'No order numbers provided.' });
    });

    it('should handle service errors', async () => {
      mockRequest.query = { orderNumbers: ['12345'] };
      mockGiftcardService.getGiftCardsByOrder.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.getByOrder(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('search', () => {
    it('should search for gift cards successfully', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issue_timestamp: '2024-01-01',
          redeem_timestamp: null,
          is_donation: false,
        },
      ];

      mockRequest.query = { card_number: '1234%' };
      mockGiftcardService.searchGiftCards.mockResolvedValueOnce(mockGiftCards);

      await giftcardController.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.searchGiftCards).toHaveBeenCalledWith('1234%');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockGiftCards);
    });

    it('should return 400 if card_number is missing', async () => {
      mockRequest.query = {};

      await giftcardController.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.searchGiftCards).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith('card_number is required!');
    });

    it('should handle service errors', async () => {
      mockRequest.query = { card_number: '1234%' };
      mockGiftcardService.searchGiftCards.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('getByDate', () => {
    it('should get gift cards by date successfully', async () => {
      const mockGiftCards = [
        {
          card_id: 1,
          card_number: '1234567890',
          items: '{"item1": 10}',
          issue_timestamp: '2024-01-01',
          redeem_timestamp: '2024-01-15 10:30:00',
          is_donation: false,
        },
      ];

      mockRequest.query = { date: '2024-01-15' };
      mockGiftcardService.getGiftCardsByDate.mockResolvedValueOnce(
        mockGiftCards
      );

      await giftcardController.getByDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getGiftCardsByDate).toHaveBeenCalledWith(
        '2024-01-15'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockGiftCards);
    });

    it('should return 400 if date is missing', async () => {
      mockRequest.query = {};

      await giftcardController.getByDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.getGiftCardsByDate).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith('Date is required');
    });

    it('should handle service errors', async () => {
      mockRequest.query = { date: '2024-01-15' };
      mockGiftcardService.getGiftCardsByDate.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.getByDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('redeem', () => {
    it('should redeem a gift card successfully', async () => {
      const mockRedeemed = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: '2024-01-01',
        redeem_timestamp: '2024-01-15 10:30:00',
        is_donation: false,
      };

      mockRequest.body = {
        card_id: 1,
        timestamp: '2024-01-15 10:30:00',
      };
      mockGiftcardService.redeemGiftCard.mockResolvedValueOnce(mockRedeemed);

      await giftcardController.redeem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.redeemGiftCard).toHaveBeenCalledWith({
        card_id: 1,
        timestamp: '2024-01-15 10:30:00',
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockRedeemed);
    });

    it('should return 400 if card_id is missing', async () => {
      mockRequest.body = { timestamp: '2024-01-15 10:30:00' };

      await giftcardController.redeem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.redeemGiftCard).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(
        'card_id and timestamp are required!'
      );
    });

    it('should return 400 if timestamp is missing', async () => {
      mockRequest.body = { card_id: 1 };

      await giftcardController.redeem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.redeemGiftCard).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(
        'card_id and timestamp are required!'
      );
    });

    it('should return 404 if gift card not found', async () => {
      mockRequest.body = {
        card_id: 999,
        timestamp: '2024-01-15 10:30:00',
      };
      mockGiftcardService.redeemGiftCard.mockResolvedValueOnce(null);

      await giftcardController.redeem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockSend).toHaveBeenCalledWith('Gift card not found');
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        card_id: 1,
        timestamp: '2024-01-15 10:30:00',
      };
      mockGiftcardService.redeemGiftCard.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.redeem(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('activate', () => {
    it('should activate a gift card with all fields', async () => {
      const mockNewCard = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: '2024-01-01 10:00:00',
        redeem_timestamp: null,
        is_donation: true,
        issued_to: 'John Doe',
        notes: 'Birthday gift',
        expiration: '2025-01-01',
        valid_starting: '2024-01-01',
      };

      mockRequest.body = {
        card_number: '1234567890',
        items: '{"item1": 10}',
        is_donation: true,
        issued_to: 'John Doe',
        notes: 'Birthday gift',
        expiration: '2025-01-01',
        valid_starting: '2024-01-01',
      };
      mockGiftcardService.activateGiftCard.mockResolvedValueOnce(mockNewCard);

      await giftcardController.activate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.activateGiftCard).toHaveBeenCalledWith({
        card_number: '1234567890',
        items: '{"item1": 10}',
        is_donation: true,
        issued_to: 'John Doe',
        notes: 'Birthday gift',
        expiration: '2025-01-01',
        valid_starting: '2024-01-01',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockNewCard);
    });

    it('should activate a gift card with minimal fields', async () => {
      const mockNewCard = {
        card_id: 1,
        card_number: '1234567890',
        items: '{"item1": 10}',
        issue_timestamp: '2024-01-01 10:00:00',
        redeem_timestamp: null,
        is_donation: false,
      };

      mockRequest.body = {
        card_number: '1234567890',
        items: '{"item1": 10}',
      };
      mockGiftcardService.activateGiftCard.mockResolvedValueOnce(mockNewCard);

      await giftcardController.activate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.activateGiftCard).toHaveBeenCalledWith({
        card_number: '1234567890',
        items: '{"item1": 10}',
        is_donation: undefined,
        issued_to: undefined,
        notes: undefined,
        expiration: undefined,
        valid_starting: undefined,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockNewCard);
    });

    it('should return 400 if card_number is missing', async () => {
      mockRequest.body = { items: '{"item1": 10}' };

      await giftcardController.activate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.activateGiftCard).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(
        'Both card_number and items are required!'
      );
    });

    it('should return 400 if items is missing', async () => {
      mockRequest.body = { card_number: '1234567890' };

      await giftcardController.activate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.activateGiftCard).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(
        'Both card_number and items are required!'
      );
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        card_number: '1234567890',
        items: '{"item1": 10}',
      };
      mockGiftcardService.activateGiftCard.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.activate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create gift cards successfully', async () => {
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
      ] as any;

      mockRequest.body = {
        card_numbers: ['1234567890', '9876543210'],
        items: 'Unlimited Wristband',
        issued_to: 'John Doe',
        is_donation: false,
        notes: 'Bulk purchase',
        expiration: '2025-12-31',
        valid_starting: '2024-01-01',
      };
      mockGiftcardService.bulkCreateGiftCards.mockResolvedValueOnce(mockNewCards);

      await giftcardController.bulkCreate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.bulkCreateGiftCards).toHaveBeenCalledWith({
        card_numbers: ['1234567890', '9876543210'],
        items: 'Unlimited Wristband',
        issued_to: 'John Doe',
        is_donation: false,
        notes: 'Bulk purchase',
        expiration: '2025-12-31',
        valid_starting: '2024-01-01',
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockNewCards);
    });

    it('should return 400 if card_numbers is missing', async () => {
      mockRequest.body = { items: 'Unlimited Wristband' };

      await giftcardController.bulkCreate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.bulkCreateGiftCards).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith('Invalid input data');
    });

    it('should return 400 if card_numbers is not an array', async () => {
      mockRequest.body = {
        card_numbers: '1234567890',
        items: 'Unlimited Wristband',
      };

      await giftcardController.bulkCreate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.bulkCreateGiftCards).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith('Invalid input data');
    });

    it('should return 400 if card_numbers is empty array', async () => {
      mockRequest.body = {
        card_numbers: [],
        items: 'Unlimited Wristband',
      };

      await giftcardController.bulkCreate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.bulkCreateGiftCards).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith('Invalid input data');
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        card_numbers: ['1234567890'],
        items: 'Unlimited Wristband',
      };
      mockGiftcardService.bulkCreateGiftCards.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.bulkCreate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('update', () => {
    it('should update a gift card successfully', async () => {
      const mockUpdatedCard = {
        card_id: 1,
        card_number: '1234567890',
        items: 'Updated Items',
        notes: 'Updated notes',
      } as any;

      mockRequest.params = { card_id: '1' };
      mockRequest.body = {
        items: 'Updated Items',
        notes: 'Updated notes',
      };
      mockGiftcardService.updateGiftCard.mockResolvedValueOnce(mockUpdatedCard);

      await giftcardController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.updateGiftCard).toHaveBeenCalledWith('1', {
        items: 'Updated Items',
        notes: 'Updated notes',
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedCard);
    });

    it('should return 404 if gift card not found', async () => {
      mockRequest.params = { card_id: '999' };
      mockRequest.body = { items: 'Updated Items' };
      mockGiftcardService.updateGiftCard.mockResolvedValueOnce(null);

      await giftcardController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.updateGiftCard).toHaveBeenCalledWith('999', {
        items: 'Updated Items',
      });
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockSend).toHaveBeenCalledWith('Gift card not found');
    });

    it('should handle service errors', async () => {
      mockRequest.params = { card_id: '1' };
      mockRequest.body = { items: 'Updated Items' };
      mockGiftcardService.updateGiftCard.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.update(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });

  describe('deleteGiftCard', () => {
    it('should delete a gift card successfully', async () => {
      mockRequest.params = { card_id: '1' };
      mockGiftcardService.deleteGiftCard.mockResolvedValueOnce(undefined);

      await giftcardController.deleteGiftCard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGiftcardService.deleteGiftCard).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockSend).toHaveBeenCalledWith('Gift card deleted successfully');
    });

    it('should handle service errors', async () => {
      mockRequest.params = { card_id: '1' };
      mockGiftcardService.deleteGiftCard.mockRejectedValueOnce(
        new Error('Service error')
      );

      await giftcardController.deleteGiftCard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith('Server Error');
    });
  });
});
