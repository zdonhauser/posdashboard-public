/**
 * Environment Configuration
 *
 * Central configuration for environment variables with type safety
 * and validation. All environment variable access should go through
 * this module to ensure consistency and catch missing variables early.
 */

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  // Server
  nodeEnv: string;
  port: number;

  // Admin
  admin: {
    passcodeHash: string;
  };

  // Database
  database: {
    user: string;
    password: string;
    name: string;
    host: string;
    port: number;
    hostBackup?: string;
    portBackup?: number;
  };

  // Stripe
  stripe: {
    secretKey: string;
    endpointSecret: string;
    apiVersion: string;
  };

  // Shopify
  shopify: {
    apiKey: string;
    password: string;
    token: string;
    shopName: string;
    webhookSecret: string;
  };

  // SEAL
  seal: {
    token: string;
    secret: string;
  };

  // Google Cloud
  google: {
    type: string;
    projectId: string;
    privateKeyId: string;
    privateKey: string;
    clientEmail: string;
    clientId: string;
    authUri: string;
    tokenUri: string;
    authProviderX509CertUrl: string;
    clientX509CertUrl: string;
    universeDomain: string;
  };
}

/**
 * Get a required environment variable
 * Throws an error if the variable is not defined
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get an environment variable as a number
 */
function getEnvAsNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

/**
 * Compute the admin passcode hash from environment variables.
 * Supports either a precomputed hash or a raw passcode value.
 * Falls back to the database password for backward compatibility.
 */
function getAdminPasscodeHash(): string {
  if (process.env.ADMIN_PASSCODE_HASH) {
    return process.env.ADMIN_PASSCODE_HASH;
  }

  const adminPasscode = getOptionalEnv(
    'ADMIN_PASSCODE',
    getRequiredEnv('DB_PASSWORD')
  );

  return bcrypt.hashSync(adminPasscode, 10);
}

/**
 * Load and validate all environment variables
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    // Server
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
    port: getEnvAsNumber('PORT', 3001),

    // Admin
    admin: {
      passcodeHash: getAdminPasscodeHash(),
    },

    // Database
    database: {
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      name: getRequiredEnv('DB_NAME'),
      host: getRequiredEnv('DB_HOST'),
      port: getEnvAsNumber('DB_PORT', 5432),
      hostBackup: process.env.DB_HOST_BACKUP,
      portBackup: process.env.DB_PORT_BACKUP
        ? parseInt(process.env.DB_PORT_BACKUP, 10)
        : undefined,
    },

    // Stripe
    stripe: {
      secretKey: getRequiredEnv('STRIPE_SECRET_KEY'),
      endpointSecret: getRequiredEnv('STRIPE_ENDPOINT_SECRET'),
      apiVersion: getOptionalEnv('STRIPE_API_VERSION', '2022-11-15'),
    },

    // Shopify
    shopify: {
      apiKey: getRequiredEnv('SHOPIFY_API_KEY'),
      password: getRequiredEnv('SHOPIFY_PASSWORD'),
      token: getRequiredEnv('SHOPIFY_TOKEN'),
      shopName: getRequiredEnv('SHOP_NAME'),
      webhookSecret: getRequiredEnv('SHOPIFY_WEBHOOK_SECRET'),
    },

    // SEAL
    seal: {
      token: getRequiredEnv('SEAL_TOKEN'),
      secret: getRequiredEnv('SEAL_SECRET'),
    },

    // Google Cloud
    google: {
      type: getOptionalEnv('GOOGLE_TYPE', 'service_account'),
      projectId: getRequiredEnv('GOOGLE_PROJECT_ID'),
      privateKeyId: getRequiredEnv('GOOGLE_PRIVATE_KEY_ID'),
      privateKey: getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      clientEmail: getRequiredEnv('GOOGLE_CLIENT_EMAIL'),
      clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
      authUri: getRequiredEnv('GOOGLE_AUTH_URI'),
      tokenUri: getRequiredEnv('GOOGLE_TOKEN_URI'),
      authProviderX509CertUrl: getRequiredEnv('GOOGLE_AUTH_PROVIDER_X509_CERT_URL'),
      clientX509CertUrl: getRequiredEnv('GOOGLE_CLIENT_X509_CERT_URL'),
      universeDomain: getOptionalEnv('GOOGLE_UNIVERSE_DOMAIN', 'googleapis.com'),
    },
  };
}

/**
 * Singleton instance of environment configuration
 */
export const env: EnvironmentConfig = loadEnvironmentConfig();

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return env.nodeEnv === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return env.nodeEnv === 'development';
};

/**
 * Check if running in test environment
 */
export const isTest = (): boolean => {
  return env.nodeEnv === 'test';
};

/**
 * Check if running in Electron
 */
export const isElectron = (): boolean => {
  return env.nodeEnv === 'electron';
};
