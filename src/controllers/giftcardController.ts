/**
 * Gift Card Controller
 * Handles HTTP requests for gift card operations
 */

import { Request, Response } from 'express';
import * as giftcardService from '../services/giftcardService';
import { ParsedQs } from 'qs';

/**
 * GET /api/giftcards
 * Get all gift cards ordered by card_id descending
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const giftCards = await giftcardService.getAllGiftCards();
    res.status(200).json(giftCards);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * GET /api/giftcards/order
 * Search for gift cards by order numbers
 */
export async function getByOrder(req: Request, res: Response): Promise<void> {
  try {
    let orderNumbers = req.query.orderNumbers as ParsedQs[] | string | string[];

    if (!orderNumbers) {
      res.status(400).json({ error: 'No order numbers provided.' });
      return;
    }

    // Ensure orderNumbers is always an array of strings
    let orderNumbersArray: string[];
    if (Array.isArray(orderNumbers)) {
      orderNumbersArray = orderNumbers.map(item => String(item));
    } else {
      orderNumbersArray = [String(orderNumbers)];
    }

    const giftCards = await giftcardService.getGiftCardsByOrder(orderNumbersArray);
    res.status(200).json(giftCards);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * GET /api/search-gift-cards
 * Search for gift cards by card number
 */
export async function search(req: Request, res: Response): Promise<void> {
  try {
    const card_number = req.query.card_number as string;

    if (!card_number) {
      res.status(400).send('card_number is required!');
      return;
    }

    const giftCards = await giftcardService.searchGiftCards(card_number);
    res.status(200).json(giftCards);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * GET /api/get-gift-cards-by-date
 * Get redeemed gift cards for a specific date
 */
export async function getByDate(req: Request, res: Response): Promise<void> {
  try {
    const date = req.query.date as string;

    if (!date) {
      res.status(400).send('Date is required');
      return;
    }

    const giftCards = await giftcardService.getGiftCardsByDate(date);
    res.status(200).json(giftCards);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/redeem-gift-card
 * Redeem a gift card by setting the redeem timestamp
 */
export async function redeem(req: Request, res: Response): Promise<void> {
  try {
    const { card_id, timestamp } = req.body;

    if (!card_id || !timestamp) {
      res.status(400).send('card_id and timestamp are required!');
      return;
    }

    const updatedCard = await giftcardService.redeemGiftCard({
      card_id,
      timestamp,
    });

    if (updatedCard) {
      res.status(200).json(updatedCard);
    } else {
      res.status(404).send('Gift card not found');
    }
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/activate-gift-card
 * Activate/create a new gift card
 */
export async function activate(req: Request, res: Response): Promise<void> {
  try {
    const {
      items,
      card_number,
      is_donation,
      issued_to,
      notes,
      expiration,
      valid_starting,
    } = req.body;

    if (!card_number || !items) {
      res.status(400).send('Both card_number and items are required!');
      return;
    }

    const newCard = await giftcardService.activateGiftCard({
      card_number,
      items,
      is_donation,
      issued_to,
      notes,
      expiration,
      valid_starting,
    });

    res.status(201).json(newCard);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/giftcards
 * Bulk create multiple gift cards
 */
export async function bulkCreate(req: Request, res: Response): Promise<void> {
  try {
    const {
      issued_to,
      is_donation,
      notes,
      items,
      card_numbers,
      expiration,
      valid_starting,
    } = req.body;

    if (!card_numbers || !Array.isArray(card_numbers) || card_numbers.length === 0) {
      res.status(400).send('Invalid input data');
      return;
    }

    const newCards = await giftcardService.bulkCreateGiftCards({
      card_numbers,
      items,
      issued_to,
      is_donation,
      notes,
      expiration,
      valid_starting,
    });

    res.status(201).json(newCards);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * PUT /api/giftcard/:card_id
 * Update a gift card's fields
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { card_id } = req.params;
    const updatedData = req.body;

    const updatedCard = await giftcardService.updateGiftCard(card_id, updatedData);

    if (updatedCard) {
      res.status(200).json(updatedCard);
    } else {
      res.status(404).send('Gift card not found');
    }
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}

/**
 * DELETE /api/giftcard/:card_id
 * Delete a gift card by card_id
 */
export async function deleteGiftCard(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { card_id } = req.params;

    await giftcardService.deleteGiftCard(card_id);
    res.status(200).send('Gift card deleted successfully');
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}
