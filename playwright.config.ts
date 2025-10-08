import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

/**
 * Playwright configuration for Dashboard tests (server + client)
 * Run from posdashboard directory to test the dashboard application
 */
export default defineConfig({
  // Test directories
  testDir: './',
  testMatch: [
    '**/client/src/**/*.e2e.test.{ts,tsx}'
  ],

  // Global test settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Parallel execution settings
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  // Retry configuration
  retries: process.env.CI ? 2 : 1,

  // Fail build on CI if test.only is found
  forbidOnly: !!process.env.CI,

  // Reporter configuration
  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global setup/teardown
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Global test configuration
  use: {
    // Base device settings
    ...devices['Desktop Chrome'],

    // Screenshot settings
    screenshot: 'only-on-failure',

    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'on-first-retry',

    // Trace collection
    trace: 'retain-on-failure',

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Test environment variables
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright',
    },
  },

  // Test projects configuration
  projects: [
    {
      name: 'dashboard-client',
      testDir: './client/src',
      testMatch: '**/*.e2e.test.{ts,tsx}',
      fullyParallel: false,
      use: {
        baseURL: 'https://localhost:3000',
        ignoreHTTPSErrors: true,
        permissions: ['camera'],
        headless: true,
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
