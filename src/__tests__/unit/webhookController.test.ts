import crypto from 'crypto';

import {
  verifyShopifySignature,
  getItemsFromOrder,
  getPrintableCardsFromOrder,
  createGiftCardObjects,
  insertGiftCard,
  verifySealWebhook,
  type ShopifyOrder,
  type ShopifyLineItem,
} from '@controllers/webhookController';

describe('verifyShopifySignature', () => {
  const secret = 'test_shopify_secret';
  const payload = Buffer.from(JSON.stringify({ id: '123', amount: '42.00' }));

  it('returns true for a valid signature', () => {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    expect(verifyShopifySignature(payload, secret, hmac)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    expect(
      verifyShopifySignature(payload, secret, 'invalid-signature')
    ).toBe(false);
  });

  it('returns false when header is missing', () => {
    expect(verifyShopifySignature(payload, secret, undefined)).toBe(false);
  });
});

describe('Shopify order helpers', () => {
  const baseOrder: ShopifyOrder = {
    id: 'order-1',
    updated_at: '2024-01-01T00:00:00Z',
    line_items: [
      {
        id: 'line-1',
        name: 'Unlimited Wristband',
        sku: 'SKU-1',
        price: 25,
        quantity: 2,
      },
      {
        id: 'line-2',
        name: 'Combo Meal',
        sku: 'SKU-2',
        price: 15,
        quantity: 1,
      },
    ],
    refunds: [
      {
        refund_line_items: [
          {
            line_item: { id: 'line-1' },
            quantity: 1,
          },
        ],
      },
    ],
  };

  it('normalizes order items while accounting for refunds', () => {
    const items = getItemsFromOrder(baseOrder);

    expect(items).toHaveLength(2);
    const wristband = items.find((item) => item.id === 'line-1');
    const combo = items.find((item) => item.id === 'line-2');

    expect(wristband).toMatchObject({
      quantity: 1,
      totalAmount: 25,
      orderId: 'order-1',
    });
    expect(combo).toMatchObject({
      quantity: 1,
      totalAmount: 15,
    });
  });

  it('filters printable card line items', () => {
    const printableOrder: ShopifyOrder = {
      ...baseOrder,
      line_items: [
        ...baseOrder.line_items,
        {
          id: 'line-3',
          name: 'Unlimited Wristband',
          sku: 'SKU-3',
          price: 0,
          quantity: 1,
          variant_title: 'Printable Wristband',
        },
      ],
    };

    const printable = getPrintableCardsFromOrder(printableOrder);
    expect(printable).toHaveLength(1);
    expect(printable[0].id).toBe('line-3');
  });

  it('creates normalized gift card objects for printable line items', () => {
    const printableCards: ShopifyLineItem[] = [
      {
        id: 'gift-1',
        name: 'Unlimited Wristband',
        title: 'Unlimited Wristband',
        variant_title: 'Printable Wristband',
        sku: 'GC-1',
        price: 0,
        quantity: 1,
      },
      {
        id: 'gift-2',
        name: 'Eat & Play',
        title: 'Eat & Play',
        variant_title: 'Printable Add a Combo Meal',
        sku: 'GC-2',
        price: 0,
        quantity: 1,
      },
      {
        id: 'gift-3',
        name: 'Water Bottle',
        title: 'Water Bottle',
        variant_title: 'Physical Item',
        sku: 'GC-3',
        price: 0,
        quantity: 1,
      },
    ];

    const giftCards = createGiftCardObjects(printableCards, 'order-123');

    expect(giftCards).toHaveLength(2);
    expect(giftCards[0]).toMatchObject({
      items: 'Unlimited Wristband',
      card_number: 'gift-1',
      issued_to: 'Order order-123',
    });
    expect(giftCards[1].items).toBe('Eat & Play Combo');
  });

  it('executes insertGiftCard using provided query runner', async () => {
    const runner = jest.fn().mockResolvedValue({ rows: [] });
    const giftcard = {
      items: 'Unlimited Wristband',
      card_number: 'gift-1',
      is_donation: false,
      issued_to: 'Order order-123',
      notes: null,
      expiration: null,
      valid_starting: '12/25/2024',
    };

    await insertGiftCard(giftcard, runner);

    expect(runner).toHaveBeenCalledTimes(1);
    const [, values] = runner.mock.calls[0];
    expect(values[0]).toBe('gift-1');
    expect(values[1]).toBe('Unlimited Wristband');
    expect(values[7]).toBe('12/25/2024');
  });
});

describe('verifySealWebhook', () => {
  const secret = 'seal_secret';
  const payload = Buffer.from(JSON.stringify({ id: 'sub-1' }));

  it('returns true for a valid SEAL signature', () => {
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    expect(verifySealWebhook(payload, secret, hmac)).toBe(true);
  });

  it('returns false when signature is invalid', () => {
    expect(verifySealWebhook(payload, secret, 'wrong')).toBe(false);
  });
});
