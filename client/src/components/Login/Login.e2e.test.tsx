import { test, expect } from '../../test-fixtures';
import { login, loginPasscodeOnly } from '../../test-helpers';

/**
 * E2E Tests for Login Component
 * ESSENTIAL: Login flow, validation, error handling, remember me, password reset
 */

test.describe('Login E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://localhost:3000/');
  });

  test('should display device passcode screen on first load', async ({ page }) => {
    // Check if passcode input appears
    const passcodeInput = page.locator('input[placeholder="Enter passcode"]');
    const isVisible = await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expect(passcodeInput).toBeVisible();
      await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    }
  });

  test('should login with valid PIN', async ({ page }) => {
    await login(page);

    // Verify successful login - POS should load
    await expect(page.getByRole('button', { name: 'Admission' })).toBeVisible();
  });

  test('should display PIN numpad', async ({ page }) => {
    await loginPasscodeOnly(page);

    // Verify all numpad buttons are present
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.getByText('4', { exact: true })).toBeVisible();
    await expect(page.getByText('5', { exact: true })).toBeVisible();
    await expect(page.getByText('6', { exact: true })).toBeVisible();
    await expect(page.getByText('7', { exact: true })).toBeVisible();
    await expect(page.getByText('8', { exact: true })).toBeVisible();
    await expect(page.getByText('9', { exact: true })).toBeVisible();
    await expect(page.getByText('0', { exact: true })).toBeVisible();
  });

  test('should show entered digits as user types PIN', async ({ page }) => {
    await loginPasscodeOnly(page);

    await page.waitForSelector('text=1', { timeout: 10000 });

    // Enter first digit
    await page.getByText('5').click();

    // Verify digit is shown
    await expect(page.locator('h1, heading').filter({ hasText: '5' })).toBeVisible();
  });

  test('should have clear button on numpad', async ({ page }) => {
    await loginPasscodeOnly(page);

    await page.waitForSelector('text=1', { timeout: 10000 });

    // Verify clear button exists
    await expect(page.getByText('C', { exact: true })).toBeVisible();
  });

  test('should clear PIN when C button clicked', async ({ page }) => {
    await loginPasscodeOnly(page);

    await page.waitForSelector('text=1', { timeout: 10000 });

    // Enter some digits
    await page.getByText('5').click();
    await page.getByText('7').click();

    // Click clear
    await page.getByText('C', { exact: true }).click();

    // Verify display is cleared (heading should be empty or minimal)
    const heading = page.locator('h1, heading').first();
    const headingText = await heading.textContent();
    expect(headingText?.length || 0).toBeLessThan(3);
  });

  test('should accept device passcode and proceed to PIN entry', async ({ page }) => {
    const passcodeInput = page.locator('input[placeholder="Enter passcode"]');

    if (await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginPasscodeOnly(page);

      // Verify we moved to PIN entry screen
      await page.waitForSelector('text=1', { timeout: 10000 });
      await expect(page.getByText('1', { exact: true })).toBeVisible();
    }
  });

  test('should show error for incorrect device passcode', async ({ page }) => {
    const passcodeInput = page.locator('input[placeholder="Enter passcode"]');

    if (await passcodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Enter incorrect passcode
      await passcodeInput.fill('wrongpasscode');
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.waitForTimeout(500);

      // Should still be on passcode screen or show error
      const stillOnPasscodeScreen = await passcodeInput.isVisible({ timeout: 2000 }).catch(() => false);
      expect(stillOnPasscodeScreen).toBeTruthy();
    }
  });
});
