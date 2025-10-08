/**
 * Integration tests for database configuration failover logic.
 *
 * These tests verify that the database module rotates connection pools
 * when failover is triggered and that query retries behave as expected
 * when the first connection attempt fails.
 */

const mockPools: any[] = [];

jest.mock('pg', () => {
  const actual = jest.requireActual('pg');

  class MockPool {
    public config: any;
    public connect: jest.Mock;
    public query: jest.Mock;
    public on: jest.Mock;
    public removeAllListeners: jest.Mock;
    public end: jest.Mock;

    constructor(config: any) {
      this.config = config;
      this.connect = jest.fn();
      this.query = jest.fn();
      this.on = jest.fn();
      this.removeAllListeners = jest.fn();
      this.end = jest.fn();
      mockPools.push(this);
    }
  }

  return {
    ...actual,
    Pool: MockPool,
  };
});

describe('Database Failover Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockPools.length = 0;
    process.env = { ...originalEnv };

    Object.assign(process.env, {
      NODE_ENV: 'test',
      ADMIN_PASSCODE: 'test_admin_passcode',
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_pass',
      DB_NAME: 'test_db',
      DB_HOST: 'primary-db',
      DB_PORT: '5432',
      DB_HOST_BACKUP: 'backup-db',
      DB_PORT_BACKUP: '5433',
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_ENDPOINT_SECRET: 'whsec_test_123',
      SHOPIFY_API_KEY: 'test_api_key',
      SHOPIFY_PASSWORD: 'test_password',
      SHOPIFY_TOKEN: 'test_token',
      SHOP_NAME: 'test-shop',
      SHOPIFY_WEBHOOK_SECRET: 'test_webhook_secret',
      SEAL_TOKEN: 'test_seal_token',
      SEAL_SECRET: 'test_seal_secret',
      GOOGLE_PROJECT_ID: 'test-project',
      GOOGLE_PRIVATE_KEY_ID: 'test-key-id',
      GOOGLE_PRIVATE_KEY: 'test-private-key',
      GOOGLE_CLIENT_EMAIL: 'test@example.com',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_AUTH_URI: 'https://accounts.google.com/o/oauth2/auth',
      GOOGLE_TOKEN_URI: 'https://oauth2.googleapis.com/token',
      GOOGLE_AUTH_PROVIDER_X509_CERT_URL:
        'https://www.googleapis.com/oauth2/v1/certs',
      GOOGLE_CLIENT_X509_CERT_URL:
        'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('rotates to the backup pool configuration when failover is triggered', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const {
      initializeDatabase,
      failoverPool,
      getCurrentConfig,
    } = require('../../config/database');

    initializeDatabase();

    expect(mockPools).toHaveLength(1);
    expect(mockPools[0].config.host).toBe('primary-db');
    expect(mockPools[0].removeAllListeners).toHaveBeenCalledWith('error');
    expect(mockPools[0].on).toHaveBeenCalledWith('error', expect.any(Function));

    failoverPool();

    expect(mockPools).toHaveLength(2);
    expect(mockPools[1].config.host).toBe('backup-db');
    expect(mockPools[1].removeAllListeners).toHaveBeenCalledWith('error');
    expect(mockPools[1].on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(getCurrentConfig().host).toBe('backup-db');

    warnSpy.mockRestore();
  });

  it('retries a query after a connection failure', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { initializeDatabase, queryDB } = require('../../config/database');

    initializeDatabase();

    const primaryPool = mockPools[0];
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: ['ok'] }),
      release: jest.fn(),
    };

    primaryPool.connect
      .mockRejectedValueOnce(new Error('Primary connection failed'))
      .mockResolvedValueOnce(mockClient);

    const result = await queryDB('SELECT 1');

    expect(primaryPool.connect).toHaveBeenCalledTimes(2);
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1', []);
    expect(mockClient.release).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ rows: ['ok'] });
  });
});
