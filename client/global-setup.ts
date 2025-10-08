import { chromium } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file (from posdashboard directory)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Get credentials from environment variables
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
const TEST_PIN = process.env.TEST_PIN || '';

if (!TEST_PASSWORD || !TEST_PIN) {
  throw new Error('TEST_PASSWORD and TEST_PIN environment variables must be set');
}

async function globalSetup() {
  console.log('Setting up authentication...');
  const authFile = path.join(__dirname, 'playwright/.auth/user.json');

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    permissions: ['camera'],
  });
  const page = await context.newPage();

  // Navigate to app
  await page.goto('https://localhost:3000/');

  // Handle device passcode if it appears
  const passcodeInput = page.locator('input[placeholder="Enter passcode"]');
  if (await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passcodeInput.fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);
  }

  // Wait for PIN entry numpad
  await page.waitForSelector('text=1', { timeout: 10000 });

  // Sign in with PIN - split PIN into individual characters and click each
  const pinDigits = TEST_PIN.split('');
  for (const digit of pinDigits) {
    await page.getByText(digit, { exact: true }).click();
  }

  // Wait for POS to load
  await page.waitForSelector('button:has-text("Admission")', { timeout: 10000 });

  // Save authenticated state
  await context.storageState({ path: authFile });
  await browser.close();

  console.log('Global setup complete');
}

export default globalSetup;
