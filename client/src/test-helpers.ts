import { Page } from '@playwright/test';

// Get credentials from environment variables
// Note: Environment variables should be loaded by global-setup.ts
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
const TEST_PIN = process.env.TEST_PIN || '';

if (!TEST_PASSWORD || !TEST_PIN) {
  console.warn('Warning: TEST_PASSWORD and TEST_PIN environment variables are not set. Tests may fail.');
}

/**
 * Login helper function for E2E tests
 * Handles both device passcode and PIN entry
 */
export async function login(page: Page): Promise<void> {
  // Handle device passcode if present
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

  // Wait for POS to load - successful login
  await page.waitForSelector('button:has-text("Admission")', { timeout: 10000 });
}

/**
 * Login helper that only handles device passcode (for tests that need separate PIN handling)
 */
export async function loginPasscodeOnly(page: Page): Promise<void> {
  const passcodeInput = page.locator('input[placeholder="Enter passcode"]');
  if (await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passcodeInput.fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Enter PIN on numpad (for tests that need separate passcode handling)
 */
export async function enterPin(page: Page): Promise<void> {
  await page.waitForSelector('text=1', { timeout: 10000 });

  const pinDigits = TEST_PIN.split('');
  for (const digit of pinDigits) {
    await page.getByText(digit, { exact: true }).click();
  }
}

export { TEST_PASSWORD, TEST_PIN };
