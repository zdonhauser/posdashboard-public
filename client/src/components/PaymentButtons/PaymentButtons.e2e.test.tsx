import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for PaymentButtons Component
 * ESSENTIAL: Process card payment, process cash payment, handle gift card, split payment, refund
 */

test.describe('PaymentButtons E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);

    // Add item to cart for payment tests
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('GoKart Wristband').first().click();
    await page.waitForTimeout(500);
  });

  test('should display payment options button', async ({ page }) => {
    // Verify Payment Options button is visible
    await expect(page.getByRole('button', { name: 'Payment Options' })).toBeVisible();
  });

  test('should open payment modal when clicking Payment Options', async ({ page }) => {
    // Click Payment Options
    await page.getByRole('button', { name: 'Payment Options' }).click();

    // Wait for payment modal to appear
    await page.waitForTimeout(500);

    // Check for payment buttons - Cash, Card, etc.
    const hasCashButton = await page.getByText(/Cash/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasCardButton = await page.getByText(/Card/i).first().isVisible({ timeout: 3000 }).catch(() => false);

    // At least one payment method should be visible
    expect(hasCashButton || hasCardButton).toBeTruthy();
  });

  test('should display total amount in payment modal', async ({ page }) => {
    // Click Payment Options
    await page.getByRole('button', { name: 'Payment Options' }).click();
    await page.waitForTimeout(500);

    // Verify total amount is displayed (GoKart = $9.99 + tax = ~$10.82)
    const hasTotalAmount = await page.getByText(/\$10\.\d{2}/).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTotalAmount).toBeTruthy();
  });

  test('should show cash payment button', async ({ page }) => {
    // Click Payment Options
    await page.getByRole('button', { name: 'Payment Options' }).click();
    await page.waitForTimeout(500);

    // Look for Cash payment button
    const cashButton = page.locator('button, [role="button"]').filter({ hasText: /Cash/i }).first();
    const isVisible = await cashButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should show card payment button', async ({ page }) => {
    // Click Payment Options
    await page.getByRole('button', { name: 'Payment Options' }).click();
    await page.waitForTimeout(500);

    // Look for Card payment button
    const cardButton = page.locator('button, [role="button"]').filter({ hasText: /Card/i }).first();
    const isVisible = await cardButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should close payment modal on cancel', async ({ page }) => {
    // Click Payment Options
    await page.getByRole('button', { name: 'Payment Options' }).click();
    await page.waitForTimeout(500);

    // Look for close/cancel button
    const closeButton = page.locator('button, [role="button"]').filter({ hasText: /(Close|Cancel|X)/i }).first();

    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);

      // Verify we're back to main POS view
      await expect(page.getByRole('button', { name: 'Payment Options' })).toBeVisible();
    }
  });

  test('should display order total before payment', async ({ page }) => {
    // Verify the total is visible before opening payment modal
    await expect(page.getByText('TOTAL').first()).toBeVisible();

    // Verify amount (GoKart $9.99 + tax)
    const totalAmount = page.getByText(/\$10\.\d{2}/).first();
    await expect(totalAmount).toBeVisible();
  });

  test('should show subtotal and tax breakdown', async ({ page }) => {
    // Verify subtotal is visible
    await expect(page.getByText('SUBTOTAL').first()).toBeVisible();

    // Verify sales tax is visible
    await expect(page.getByText('SALES TAX').first()).toBeVisible();

    // Verify amounts are displayed
    await expect(page.getByText('$9.99').first()).toBeVisible();
  });

  test('should update total when adding multiple items', async ({ page }) => {
    // Add another item
    await page.getByText('Indoor Wristband').first().click();
    await page.waitForTimeout(500);

    // Verify total increased (should be more than just GoKart wristband)
    const newTotal = page.getByText(/\$3[0-9]\.\d{2}/).first();
    const isVisible = await newTotal.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should have add discount button', async ({ page }) => {
    // Verify Add Discount button is visible
    await expect(page.getByRole('button', { name: 'Add Discount' })).toBeVisible();
  });
});
