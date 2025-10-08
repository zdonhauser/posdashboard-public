import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for OrderPanel Component
 * ESSENTIAL: Display cart items, totals, discounts
 */

test.describe('OrderPanel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);
  });

  test('should display order summary section', async ({ page }) => {
    // Verify order panel elements
    await expect(page.getByText('SUBTOTAL').first()).toBeVisible();
    await expect(page.getByText('SALES TAX').first()).toBeVisible();
    await expect(page.getByText('TOTAL', { exact: true }).first()).toBeVisible();
  });

  test('should update total when item added', async ({ page }) => {
    // Add a product
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('GoKart Wristband').first().click();
    await page.waitForTimeout(500);

    // Verify total updated
    await expect(page.getByText(/\$10\.\d{2}/).first()).toBeVisible();
  });

});
