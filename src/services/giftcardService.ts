/**
 * Gift Card Service
 * Handles all gift card-related business logic and database operations
 */

import { queryDB } from '../config/database';

export interface GiftCard {
  card_id: number;
  card_number: string;
  items: string | object;
  issue_timestamp: Date | string;
  redeem_timestamp?: Date | string | null;
  is_donation?: boolean;
  issued_to?: string | null;
  notes?: string | null;
  expiration?: Date | string | null;
  valid_starting?: Date | string | null;
}

export interface CreateGiftCardParams {
  card_number: string;
  items: string | object;
  is_donation?: boolean;
  issued_to?: string | null;
  notes?: string | null;
  expiration?: Date | string | null;
  valid_starting?: Date | string | null;
}

export interface RedeemGiftCardParams {
  card_id: number;
  timestamp: Date | string;
}

export interface BulkCreateGiftCardParams {
  card_numbers: string[];
  items: string | object;
  issued_to?: string | null;
  is_donation?: boolean;
  notes?: string | null;
  expiration?: Date | string | null;
  valid_starting?: Date | string | null;
}

/**
 * Get all gift cards ordered by card_id descending
 */
export async function getAllGiftCards(): Promise<GiftCard[]> {
  const query = `
    SELECT * FROM gift_cards
    ORDER BY card_id DESC;
  `;

  const { rows } = await queryDB(query);
  return rows as GiftCard[];
}

/**
 * Search for gift cards by order numbers/order ids
 * Uses regex to extract numeric substring from issued_to field
 */
export async function getGiftCardsByOrder(orderNumbers: string[]): Promise<GiftCard[]> {
  const query = `
    SELECT * FROM gift_cards
    WHERE EXISTS (
      SELECT 1 FROM unnest($1::text[]) as search_term
      WHERE (
        (char_length(search_term) < 11
          AND char_length(substring(gift_cards.issued_to from '(\\d+)')) < 11
          AND left(substring(gift_cards.issued_to from '(\\d+)'), char_length(search_term)) = search_term)
        OR
        (char_length(search_term) >= 11
          AND char_length(substring(gift_cards.issued_to from '(\\d+)')) >= 11
          AND substring(gift_cards.issued_to from '(\\d+)') = search_term)
      )
    )
    ORDER BY card_id DESC;
  `;

  const { rows } = await queryDB(query, [orderNumbers]);
  return rows as GiftCard[];
}

/**
 * Search for gift cards by card number (supports LIKE search)
 */
export async function searchGiftCards(cardNumber: string): Promise<GiftCard[]> {
  const query = `
    SELECT * FROM gift_cards
    WHERE card_number LIKE $1;
  `;

  const { rows } = await queryDB(query, [cardNumber]);
  return rows as GiftCard[];
}

/**
 * Get redeemed gift cards by date range
 */
export async function getGiftCardsByDate(date: string): Promise<GiftCard[]> {
  // Format the date to ensure it covers the full day (00:00:00 to 23:59:59)
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const query = `
    SELECT * FROM gift_cards
    WHERE redeem_timestamp >= $1 AND redeem_timestamp <= $2
    ORDER BY redeem_timestamp DESC;
  `;

  const { rows } = await queryDB(query, [startDate, endDate]);
  return rows as GiftCard[];
}

/**
 * Redeem a gift card by setting the redeem timestamp
 */
export async function redeemGiftCard(
  params: RedeemGiftCardParams
): Promise<GiftCard | null> {
  const { card_id, timestamp } = params;

  const query = `
    UPDATE gift_cards
    SET redeem_timestamp = $1
    WHERE card_id = $2
    RETURNING *;
  `;

  const { rows } = await queryDB(query, [timestamp, card_id]);
  return rows.length > 0 ? (rows[0] as GiftCard) : null;
}

/**
 * Activate/create a new gift card
 */
export async function activateGiftCard(
  params: CreateGiftCardParams
): Promise<GiftCard> {
  const {
    card_number,
    items,
    is_donation,
    issued_to,
    notes,
    expiration,
    valid_starting,
  } = params;

  const timestamp = new Date().toLocaleString();

  const query = `
    INSERT INTO gift_cards (card_number, items, issue_timestamp, is_donation, issued_to, notes, expiration, valid_starting)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const queryParams = [
    card_number,
    items,
    timestamp,
    is_donation || false,
    issued_to || null,
    notes || null,
    expiration || null,
    valid_starting || null,
  ];

  const { rows } = await queryDB(query, queryParams);
  return rows[0] as GiftCard;
}

/**
 * Bulk create multiple gift cards at once
 */
export async function bulkCreateGiftCards(
  params: BulkCreateGiftCardParams
): Promise<GiftCard[]> {
  const {
    card_numbers,
    items,
    issued_to,
    is_donation,
    notes,
    expiration,
    valid_starting,
  } = params;

  const giftCardsToInsert = card_numbers.map((card_number) => ({
    card_number,
    issued_to,
    items,
    is_donation,
    notes,
    expiration,
    valid_starting,
  }));

  const values: any[] = [];
  const placeholders: string[] = [];

  giftCardsToInsert.forEach((gc, index) => {
    const idx = index * 7;
    values.push(
      gc.card_number,
      gc.issued_to || null,
      gc.items,
      gc.is_donation || false,
      gc.notes || null,
      gc.expiration || null,
      gc.valid_starting || null
    );
    placeholders.push(
      `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${
        idx + 6
      }, $${idx + 7})`
    );
  });

  const query = `
    INSERT INTO gift_cards (card_number, issued_to, items, is_donation, notes, expiration, valid_starting)
    VALUES ${placeholders.join(', ')}
    RETURNING *;
  `;

  const { rows } = await queryDB(query, values);
  return rows as GiftCard[];
}

/**
 * Update a gift card's fields
 */
export async function updateGiftCard(
  cardId: string,
  updatedData: Partial<GiftCard>
): Promise<GiftCard | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updatedData)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }

  const query = `
    UPDATE gift_cards
    SET ${fields.join(', ')}
    WHERE card_id = $${idx}
    RETURNING *;
  `;

  values.push(cardId);

  const { rows } = await queryDB(query, values);
  return rows.length > 0 ? (rows[0] as GiftCard) : null;
}

/**
 * Delete a gift card by card_id
 */
export async function deleteGiftCard(cardId: string): Promise<void> {
  const query = `
    DELETE FROM gift_cards
    WHERE card_id = $1;
  `;

  await queryDB(query, [cardId]);
}
