/**
 * Gift Card Routes
 * Defines all gift card-related API endpoints
 */

import { Router } from 'express';
import * as giftcardController from '../controllers/giftcardController';

const router = Router();

/**
 * @route   GET /api/giftcards
 * @desc    Get all gift cards ordered by card_id descending
 * @access  Protected (requires JWT authentication)
 */
router.get('/giftcards', giftcardController.getAll);

/**
 * @route   GET /api/giftcards/order
 * @desc    Search for gift cards by order numbers
 * @access  Protected (requires JWT authentication)
 * @query   orderNumbers - Array of order numbers to search
 */
router.get('/giftcards/order', giftcardController.getByOrder);

/**
 * @route   POST /api/giftcards
 * @desc    Bulk create multiple gift cards
 * @access  Protected (requires JWT authentication)
 * @body    { card_numbers: string[], items: string|object, issued_to?: string, is_donation?: boolean, notes?: string, expiration?: string, valid_starting?: string }
 */
router.post('/giftcards', giftcardController.bulkCreate);

/**
 * @route   GET /api/search-gift-cards
 * @desc    Search for gift cards by card number
 * @access  Protected (requires JWT authentication)
 * @query   card_number - Card number to search (supports LIKE pattern)
 */
router.get('/search-gift-cards', giftcardController.search);

/**
 * @route   GET /api/get-gift-cards-by-date
 * @desc    Get redeemed gift cards for a specific date
 * @access  Protected (requires JWT authentication)
 * @query   date - Date to filter redeems (format: YYYY-MM-DD)
 */
router.get('/get-gift-cards-by-date', giftcardController.getByDate);

/**
 * @route   POST /api/redeem-gift-card
 * @desc    Redeem a gift card by setting the redeem timestamp
 * @access  Protected (requires JWT authentication)
 * @body    { card_id: number, timestamp: string }
 */
router.post('/redeem-gift-card', giftcardController.redeem);

/**
 * @route   POST /api/activate-gift-card
 * @desc    Activate/create a new gift card
 * @access  Protected (requires JWT authentication)
 * @body    { card_number: string, items: string|object, is_donation?: boolean, issued_to?: string, notes?: string, expiration?: string, valid_starting?: string }
 */
router.post('/activate-gift-card', giftcardController.activate);

/**
 * @route   PUT /api/giftcard/:card_id
 * @desc    Update a gift card's fields
 * @access  Protected (requires JWT authentication)
 * @params  card_id - Gift card ID to update
 * @body    Partial gift card object with fields to update
 */
router.put('/giftcard/:card_id', giftcardController.update);

/**
 * @route   DELETE /api/giftcard/:card_id
 * @desc    Delete a gift card by card_id
 * @access  Protected (requires JWT authentication)
 * @params  card_id - Gift card ID to delete
 */
router.delete('/giftcard/:card_id', giftcardController.deleteGiftCard);

export default router;
