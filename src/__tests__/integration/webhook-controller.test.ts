import crypto from 'crypto';
import type { Request, Response } from 'express';

import {
  handleShopifyNewTransaction,
  handleShopifyOrderUpdate,
  handleShopifyOrderCreation,
  handleStripeWebhook,
  handleSealSubscriptionWebhook,
} from '@controllers/webhookController';

jest.mock('@config/database', () => ({
  queryDB: jest.fn(),
}));

jest.mock('@config/shopify', () => {
  const customerApi = {
    search: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
  };

  const createShopifyClient = jest.fn(() => ({
    customer: customerApi,
  }));

  return {
    shopifyConfig: {
      webhookSecret: 'shopify_test_secret',
      shopName: 'test-shop',
      accessToken: 'test-token',
    },
    createShopifyClient,
    shopify: {
      customer: customerApi,
    },
  };
});

jest.mock('@config/stripe', () => {
  const constructEvent = jest.fn((body: Buffer | string) => {
    const raw = Buffer.isBuffer(body) ? body.toString('utf8') : body;
    return JSON.parse(raw);
  });

  return {
    stripe: {
      webhooks: {
        constructEvent,
      },
      billingPortal: { sessions: { create: jest.fn() } },
      paymentMethods: { list: jest.fn() },
      paymentIntents: { create: jest.fn() },
      customers: {
        create: jest.fn(),
        update: jest.fn(),
      },
    },
    endpointSecret: 'stripe_test_secret',
  };
});

jest.mock('@config/environment', () => ({
  env: {
    nodeEnv: 'test',
    port: 3001,
    admin: { passcodeHash: 'hash' },
    database: {
      user: 'user',
      password: 'pass',
      name: 'db',
      host: 'localhost',
      port: 5432,
    },
    stripe: {
      secretKey: 'sk_test',
      endpointSecret: 'stripe_test_secret',
      apiVersion: '2022-11-15',
    },
    shopify: {
      apiKey: 'key',
      password: 'password',
      token: 'token',
      shopName: 'test-shop',
      webhookSecret: 'shopify_test_secret',
    },
    seal: {
      token: 'seal_token',
      secret: 'seal_secret',
    },
    google: {
      type: 'service_account',
      projectId: 'project',
      privateKeyId: 'key',
      privateKey: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n',
      clientEmail: 'test@example.com',
      clientId: 'client',
      authUri: 'https://accounts.google.com/o/oauth2/auth',
      tokenUri: 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl: 'https://www.googleapis.com/oauth2/v1/certs',
      clientX509CertUrl: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
      universeDomain: 'googleapis.com',
    },
  },
  isElectron: jest.fn(() => false),
  isProduction: jest.fn(() => false),
  isDevelopment: jest.fn(() => false),
  isTest: jest.fn(() => true),
}));

const { queryDB } = jest.requireMock('@config/database') as {
  queryDB: jest.Mock;
};

const {
  createShopifyClient,
  shopify: { customer: customerApi },
} = jest.requireMock('@config/shopify') as {
  createShopifyClient: jest.Mock;
  shopify: {
    customer: {
      search: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };
};

const { stripe } = jest.requireMock('@config/stripe') as {
  stripe: {
    webhooks: { constructEvent: jest.Mock };
    customers: { create: jest.Mock; update: jest.Mock };
  };
};

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendStatus: jest.fn(),
  };
  return res as unknown as Response & {
    status: jest.Mock;
    send: jest.Mock;
    json: jest.Mock;
    sendStatus: jest.Mock;
  };
}

function createShopifyRequest(payload: any, signature?: string) {
  const buffer = Buffer.from(JSON.stringify(payload));
  return {
    body: buffer,
    get: (header: string) =>
      header === 'X-Shopify-Hmac-Sha256' ? signature : undefined,
  } as unknown as Request;
}

function signShopifyPayload(payload: any) {
  const buffer = Buffer.from(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', 'shopify_test_secret')
    .update(buffer)
    .digest('base64');
  return signature;
}

function createStripeRequest(event: any, signature = 'sig') {
  return {
    body: Buffer.from(JSON.stringify(event)),
    headers: {
      'stripe-signature': signature,
    },
  } as unknown as Request;
}

function createSealRequest(payload: any, signature?: string) {
  const buffer = Buffer.from(JSON.stringify(payload));
  return {
    body: buffer,
    get: (header: string) =>
      header === 'X-Seal-Hmac-Sha256' ? signature : undefined,
  } as unknown as Request;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Shopify webhooks', () => {
  it('acknowledges a valid new transaction', async () => {
    queryDB.mockResolvedValue({ rows: [{ id: 'tx-1' }] });
    const payload = {
      id: 'tx-1',
      order_id: 'order-1',
      kind: 'sale',
      gateway: 'test',
      status: 'success',
      message: null,
      created_at: '2024-01-01T00:00:00Z',
      test: false,
      authorization: 'auth',
      location_id: 'loc',
      user_id: 'user',
      parent_id: null,
      processed_at: '2024-01-01T00:00:00Z',
      device_id: 'device',
      error_code: null,
      source_name: 'web',
      amount: '10.00',
      currency: 'USD',
      payment_id: 'payment-1',
      manual_payment_gateway: null,
      admin_graphql_api_id: 'gid://shopify/Transaction/1',
    };
    const signature = signShopifyPayload(payload);
    const req = createShopifyRequest(payload, signature);
    const res = createMockResponse();

    await handleShopifyNewTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(queryDB).toHaveBeenCalledTimes(1);
    expect(queryDB.mock.calls[0][0]).toContain('INSERT INTO transactions');
  });

  it('persists order item deltas', async () => {
    const previous = {
      id: 'order-1',
      updated_at: '2024-01-01T00:00:00Z',
      line_items: [
        {
          id: 'line-1',
          name: 'Unlimited Wristband',
          sku: 'SKU-1',
          price: 25,
          quantity: 1,
        },
      ],
      refunds: [],
    };

    queryDB
      .mockResolvedValueOnce({ rows: [{ full_order: previous }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const update = {
      ...previous,
      line_items: [
        {
          id: 'line-1',
          name: 'Unlimited Wristband',
          sku: 'SKU-1',
          price: 25,
          quantity: 2,
        },
      ],
      updated_at: '2024-01-02T00:00:00Z',
    };

    const signature = signShopifyPayload(update);
    const req = createShopifyRequest(update, signature);
    const res = createMockResponse();

    await handleShopifyOrderUpdate(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(queryDB).toHaveBeenCalledTimes(3);
    const lineItemArgs = queryDB.mock.calls[1][1];
    expect(lineItemArgs[4]).toBe(1); // quantity delta
    expect(queryDB.mock.calls[2][0]).toContain('INSERT INTO orders');
  });

  it('creates gift card records for printable items', async () => {
    queryDB.mockResolvedValue({ rows: [] });
    const order = {
      id: 'order-42',
      updated_at: '2024-01-01T00:00:00Z',
      line_items: [
        {
          id: 'gift-1',
          name: 'Unlimited Wristband',
          title: 'Unlimited Wristband',
          variant_title: 'Printable Wristband',
          sku: 'SKU-GIFT',
          price: 0,
          quantity: 1,
        },
      ],
      refunds: [],
    };

    const signature = signShopifyPayload(order);
    const req = createShopifyRequest(order, signature);
    const res = createMockResponse();

    await handleShopifyOrderCreation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(queryDB).toHaveBeenCalledTimes(1);
    expect(queryDB.mock.calls[0][0]).toContain('INSERT INTO gift_cards');
  });
});

describe('Stripe webhooks', () => {
  it('returns 400 for invalid signatures', async () => {
    stripe.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error('bad signature');
    });
    const req = createStripeRequest({ type: 'order.created', data: { object: {} } });
    const res = createMockResponse();

    await handleStripeWebhook(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(400);
  });

  it('acknowledges order.created events', async () => {
    const event = {
      type: 'order.created',
      data: {
        object: {
          line_items: [{ name: 'Item', quantity: 1, amount: 1000 }],
          email: 'customer@example.com',
        },
      },
    };
    const req = createStripeRequest(event);
    const res = createMockResponse();

    await handleStripeWebhook(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('creates Shopify customers when none exist', async () => {
    customerApi.search.mockResolvedValueOnce([]);
    const event = {
      type: 'customer.created',
      data: {
        object: {
          id: 'cus_123',
          email: 'customer@example.com',
          name: 'Customer',
        },
      },
    };

    const req = createStripeRequest(event);
    const res = createMockResponse();

    await handleStripeWebhook(req, res);

    expect(createShopifyClient).toHaveBeenCalled();
    expect(customerApi.search).toHaveBeenCalledWith({ query: 'customer@example.com', limit: 1 });
    expect(customerApi.create).toHaveBeenCalled();
  });
});

describe('SEAL subscription webhook', () => {
  it('stores member details for subscription items', async () => {
    queryDB.mockResolvedValue({ rows: [{ id: 'member-1' }] });
    const payload = {
      id: 'sub-1',
      email: 'member@example.com',
      items: [
        {
          title: 'Member Plan - Premium',
          quantity: 1,
          properties: [
            { key: 'name_1', value: 'Jane Doe' },
            { key: 'dob_1', value: '01/15/2000' },
            { key: 'gcid', value: 'BARCODE123' },
          ],
          selling_plan_id: 'plan-1',
        },
      ],
    };

    const signature = crypto
      .createHmac('sha256', 'seal_secret')
      .update(Buffer.from(JSON.stringify(payload)))
      .digest('base64');

    const req = createSealRequest(payload, signature);
    const res = createMockResponse();

    await handleSealSubscriptionWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(queryDB).toHaveBeenCalledTimes(1);
    const [, params] = queryDB.mock.calls[0];
    expect(params[0]).toBe('Jane Doe');
    expect(params[2]).toBe('2000-01-15');
  });
});
