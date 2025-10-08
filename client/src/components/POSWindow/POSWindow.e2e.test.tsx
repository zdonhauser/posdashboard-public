import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for POSWindow Component
 * ESSENTIAL: Main POS interface, product selection, cart management, checkout flow
 */

test.describe('POSWindow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);
  });

  test('should load POS interface', async ({ page }) => {
    // Verify POS loaded successfully
    await expect(page.getByRole('button', { name: 'Admission' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Merch' })).toBeVisible();
  });

  test('should display category buttons', async ({ page }) => {
    // Verify all main categories are visible
    await expect(page.getByRole('button', { name: 'Admission' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Merch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Food' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Drinks' })).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    // Verify action buttons are present
    await expect(page.getByRole('button', { name: 'Add Discount' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Payment Options' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear Order' })).toBeVisible();
  });

  test('should show order totals', async ({ page }) => {
    // Verify totals section is visible
    await expect(page.getByText('SUBTOTAL').first()).toBeVisible();
    await expect(page.getByText('SALES TAX').first()).toBeVisible();
    await expect(page.getByText('TOTAL').first()).toBeVisible();
  });

  test('should allow product selection', async ({ page }) => {
    // Click on Admission category
    await page.getByRole('button', { name: 'Admission' }).click();

    // Verify products are displayed
    await expect(page.getByText('Unlimited Wristband').first()).toBeVisible();
    await expect(page.getByText('GoKart Wristband').first()).toBeVisible();
  });

  test('should update total when adding product', async ({ page }) => {
    // Add a product to cart
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();
    await page.waitForTimeout(500);

    // Verify total changed
    await expect(page.getByText('$38.96').first()).toBeVisible();
  });
});
