import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for SuggestionsModal Component
 * ESSENTIAL: Customer suggestions display and selection
 */

test.describe('SuggestionsModal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);
  });

  test('should be on POS page', async ({ page }) => {
    // Verify we're on the POS page (suggestions modal is contextual)
    await expect(page.getByRole('button', { name: 'Admission' })).toBeVisible();
  });

});
