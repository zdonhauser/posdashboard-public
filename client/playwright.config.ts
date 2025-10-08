import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from posdashboard .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Playwright configuration for Dashboard Client E2E Tests
 * Tests the React dashboard web application
 */
export default defineConfig({
  // Test directory - look for e2e tests in src
  testDir: './src',
  testMatch: '**/*.e2e.test.{ts,tsx}',

  // Global test settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Run tests in parallel
  fullyParallel: false,
  workers: 1, // Use single worker to reuse browser context

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Fail build on CI if test.only is found
  forbidOnly: !!process.env.CI,

  // Reporter configuration
  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['list']
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Global test configuration
  use: {
    // Base URL for the application
    baseURL: 'https://localhost:3000',

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

    // Accept self-signed certificates (for local HTTPS)
    ignoreHTTPSErrors: true,

    // Browser permissions
    permissions: ['camera'],
  },

  // Test projects configuration
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Grant camera permissions by default
        permissions: ['camera'],
        // Run headless
        headless: true,
      },
    },
  ],

  // Run local dev server before tests (only when running tests from client directory)
  webServer: {
    command: 'yarn dev',
    url: 'https://localhost:3000',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 120000, // 2 minutes for server to start
  },
});
