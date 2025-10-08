/**
 * Configuration Module Unit Tests
 *
 * Tests for all configuration modules to ensure proper
 * initialization and environment variable loading.
 */

import bcrypt from 'bcrypt';

describe('Configuration Modules', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
    // Restore original environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Configuration', () => {
    it('should load environment variables correctly', () => {
      // Set test environment variables
      process.env.NODE_ENV = 'test';
      process.env.PORT = '3001';
      process.env.ADMIN_PASSCODE = 'test_admin_passcode';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';

      const { env, isTest, isDevelopment, isProduction } = require('../../config/environment');

      expect(env.nodeEnv).toBe('test');
      expect(env.port).toBe(3001);
      expect(bcrypt.compareSync('test_admin_passcode', env.admin.passcodeHash)).toBe(true);
      expect(env.database.user).toBe('test_user');
      expect(env.database.password).toBe('test_pass');
      expect(env.database.name).toBe('test_db');
      expect(env.database.host).toBe('localhost');
      expect(env.database.port).toBe(5432);
      expect(env.stripe.secretKey).toBe('sk_test_123');
      expect(env.shopify.apiKey).toBe('test_api_key');
      expect(isTest()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
    });

    it('should throw error for missing required environment variables', () => {
      // Prevent dotenv from repopulating process.env
      jest.doMock('dotenv', () => ({
        config: jest.fn(),
      }));

      // Clear all environment variables
      process.env = {};

      expect(() => {
        require('../../config/environment');
      }).toThrow();

      jest.dontMock('dotenv');
    });

    it('should use default values for optional environment variables', () => {
      // Prevent dotenv from repopulating optional values
      jest.doMock('dotenv', () => ({
        config: jest.fn(),
      }));

      // Delete optional environment variables to test defaults
      delete process.env.PORT;
      delete process.env.DB_PORT;
      delete process.env.STRIPE_API_VERSION;
      delete process.env.GOOGLE_UNIVERSE_DOMAIN;

      // Set only required variables
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_PASSCODE = 'test_admin_passcode';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';

      const { env } = require('../../config/environment');

      expect(env.port).toBe(3001); // Default port
      expect(env.database.port).toBe(5432); // Default DB port
      expect(env.stripe.apiVersion).toBe('2022-11-15'); // Default Stripe API version
      expect(env.google.universeDomain).toBe('googleapis.com'); // Default Google domain
      expect(bcrypt.compareSync('test_admin_passcode', env.admin.passcodeHash)).toBe(true);

      jest.dontMock('dotenv');
    });
  });

  describe('Database Configuration', () => {
    beforeEach(() => {
      // Set required environment variables for database config
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';
    });

    it('should create database configuration with primary node', () => {
      const { DB_CONFIGS } = require('../../config/database');

      expect(DB_CONFIGS).toHaveLength(1);
      expect(DB_CONFIGS[0]).toEqual({
        user: 'test_user',
        password: 'test_pass',
        database: 'test_db',
        host: 'localhost',
        port: 5432,
      });
    });

    it('should create database configuration with backup node', () => {
      process.env.DB_HOST_BACKUP = 'localhost-backup';
      process.env.DB_PORT_BACKUP = '5433';

      jest.resetModules();
      const { DB_CONFIGS } = require('../../config/database');

      expect(DB_CONFIGS).toHaveLength(2);
      expect(DB_CONFIGS[1]).toEqual({
        user: 'test_user',
        password: 'test_pass',
        database: 'test_db',
        host: 'localhost-backup',
        port: 5433,
      });
    });

    it('should create a connection pool', () => {
      const { createPool } = require('../../config/database');
      const pool = createPool();

      expect(typeof pool.query).toBe('function');
      expect(typeof pool.connect).toBe('function');
    });

    it('should provide current configuration', () => {
      const { getCurrentConfig } = require('../../config/database');
      const config = getCurrentConfig();

      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('database');
    });

    it('should report correct node count', () => {
      const { getNodeCount } = require('../../config/database');

      expect(getNodeCount()).toBe(1);
    });

    it('should report correct node count with backup', () => {
      process.env.DB_HOST_BACKUP = 'localhost-backup';
      process.env.DB_PORT_BACKUP = '5433';

      jest.resetModules();
      const { getNodeCount } = require('../../config/database');

      expect(getNodeCount()).toBe(2);
    });
  });

  describe('Stripe Configuration', () => {
    beforeEach(() => {
      // Set all required environment variables
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';
    });

    it('should initialize Stripe client', () => {
      const { stripe } = require('../../config/stripe');

      expect(stripe).toBeDefined();
      expect(typeof stripe.paymentIntents).toBe('object');
    });

    it('should export endpoint secret', () => {
      const { endpointSecret } = require('../../config/stripe');

      expect(endpointSecret).toBe('whsec_test_123');
    });
  });

  describe('Shopify Configuration', () => {
    beforeEach(() => {
      // Set all required environment variables
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';
    });

    it('should export shopify configuration', () => {
      const { shopifyConfig } = require('../../config/shopify');

      expect(shopifyConfig).toEqual({
        shopName: 'test-shop',
        apiKey: 'test_api_key',
        password: 'test_password',
        accessToken: 'test_token',
        webhookSecret: 'test_webhook_secret',
      });
    });

    it('should create Shopify client', () => {
      const { createShopifyClient } = require('../../config/shopify');
      const client = createShopifyClient();

      expect(client).toBeDefined();
    });

    it('should initialize global Shopify client', () => {
      const { shopify } = require('../../config/shopify');

      expect(shopify).toBeDefined();
    });
  });

  describe('Google Drive Configuration', () => {
    beforeEach(() => {
      // Set all required environment variables
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_pass';
      process.env.DB_NAME = 'test_db';
      process.env.DB_HOST = 'localhost';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_ENDPOINT_SECRET = 'whsec_test_123';
      process.env.SHOPIFY_API_KEY = 'test_api_key';
      process.env.SHOPIFY_PASSWORD = 'test_password';
      process.env.SHOPIFY_TOKEN = 'test_token';
      process.env.SHOP_NAME = 'test-shop';
      process.env.SHOPIFY_WEBHOOK_SECRET = 'test_webhook_secret';
      process.env.SEAL_TOKEN = 'test_seal_token';
      process.env.SEAL_SECRET = 'test_seal_secret';
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_PRIVATE_KEY_ID = 'test-key-id';
      process.env.GOOGLE_PRIVATE_KEY = 'test-private-key';
      process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
      process.env.GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
      process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL =
        'https://www.googleapis.com/oauth2/v1/certs';
      process.env.GOOGLE_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com';
    });

    it('should export Google service account configuration', () => {
      const { googleServiceAccountKey } = require('../../config/google-drive');

      expect(googleServiceAccountKey).toEqual({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'test-key-id',
        private_key: 'test-private-key',
        client_email: 'test@example.com',
        client_id: 'test-client-id',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com',
        universe_domain: 'googleapis.com',
      });
    });

    it('should export Drive API scopes', () => {
      const { SCOPES } = require('../../config/google-drive');

      expect(SCOPES).toEqual(['https://www.googleapis.com/auth/drive']);
    });

    it('should initialize JWT auth client', () => {
      const { auth } = require('../../config/google-drive');

      expect(auth).toBeDefined();
      expect(auth.email).toBe('test@example.com');
    });

    it('should initialize Drive API client', () => {
      const { drive } = require('../../config/google-drive');

      expect(drive).toBeDefined();
    });
  });
});
