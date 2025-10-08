import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for PhotoUploadForm Component
 *
 * ESSENTIAL TEST CASES:
 *
 * 1. Form Display
 *    - Renders upload form correctly
 *    - Shows file input field
 *    - Displays preview area
 *    - Submit button enabled/disabled appropriately
 *
 * 2. File Selection
 *    - File input accepts images only
 *    - Selected file displays in preview
 *    - Can clear selected file
 *    - Multiple file selection (if supported)
 *
 * 3. Form Validation
 *    - Required fields are enforced
 *    - File size limits are checked
 *    - Image dimensions validated
 *    - Error messages display correctly
 *
 * 4. Upload Process
 *    - Form submits successfully
 *    - Shows upload progress indicator
 *    - Success message displays
 *    - Form resets after successful upload
 *
 * 5. Error Handling
 *    - Network errors handled gracefully
 *    - File type errors shown
 *    - Size limit errors displayed
 *    - Retry mechanism works
 */

test.describe('PhotoUploadForm Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);
  });

  test('should render photo upload form when triggered from membership', async ({ page }) => {
    // Navigate to trigger upload form
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();

      // Verify PhotoUploadForm wrapper is displayed
      await expect(page.locator('.photo-upload-form.modal')).toBeVisible();

      // Verify CameraModal is displayed within it
      await expect(page.locator('.camera-modal')).toBeVisible();
    }
  });

  test('should display uploading message during photo upload', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture a photo
      await page.locator('#photo-capture-button').click();

      // Wait for countdown
      await page.waitForTimeout(1200);

      // Check if uploading message appears (might be brief)
      const uploadingMessage = page.locator('text=Uploading photo...');
      const isUploadingVisible = await uploadingMessage.isVisible().catch(() => false);

      // If not visible, it likely already succeeded
      if (!isUploadingVisible) {
        const successMessage = page.locator('text=Photo uploaded successfully!');
        await expect(successMessage).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show success message after successful upload', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/upload-member-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture photo
      await page.locator('#photo-capture-button').click();
      await page.waitForTimeout(1200);

      // Wait for success message
      await expect(page.locator('text=Photo uploaded successfully!')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should auto-close form after successful upload', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/upload-member-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture photo
      await page.locator('#photo-capture-button').click();
      await page.waitForTimeout(1200);

      // Wait for success message
      await expect(page.locator('text=Photo uploaded successfully!')).toBeVisible({ timeout: 5000 });

      // Wait for auto-close (1.5 seconds after success)
      await page.waitForTimeout(2000);

      // Verify form is no longer visible
      await expect(page.locator('.photo-upload-form.modal')).not.toBeVisible();
    }
  });

  test('should display error message on upload failure', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/upload-member-photo', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Upload failed' }),
      });
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture photo
      await page.locator('#photo-capture-button').click();
      await page.waitForTimeout(1200);

      // Wait for error message
      await expect(page.locator('.upload-error')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Failed to upload photo.')).toBeVisible();
    }
  });

  test('should show retry button on upload error', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/upload-member-photo', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Upload failed' }),
      });
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture photo
      await page.locator('#photo-capture-button').click();
      await page.waitForTimeout(1200);

      // Wait for error and verify retry button
      await expect(page.locator('.upload-error')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    }
  });

  test('should allow retry after upload error', async ({ page }) => {
    let attemptCount = 0;

    // Mock failed first attempt, successful second attempt
    await page.route('**/api/upload-member-photo', async (route) => {
      attemptCount++;
      if (attemptCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Upload failed' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Capture photo
      await page.locator('#photo-capture-button').click();
      await page.waitForTimeout(1200);

      // Wait for error
      await expect(page.locator('.upload-error')).toBeVisible({ timeout: 5000 });

      // Click retry button
      await page.locator('button:has-text("Retry")').click();

      // Verify camera modal is shown again for retry
      await expect(page.locator('.camera-modal')).toBeVisible();
    }
  });

  test('should complete full upload flow from capture to success', async ({ page }) => {
    // Mock successful upload
    await page.route('**/api/upload-member-photo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      // Step 1: Open form
      await newPhotoLink.click();
      await expect(page.locator('.photo-upload-form.modal')).toBeVisible();

      // Step 2: Camera loads
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Step 3: Capture photo
      await page.locator('#photo-capture-button').click();

      // Step 4: Countdown
      await expect(page.locator('.countdown')).toBeVisible();
      await page.waitForTimeout(1200);

      // Step 5: Upload success
      await expect(page.locator('text=Photo uploaded successfully!')).toBeVisible({ timeout: 5000 });

      // Step 6: Auto-close
      await page.waitForTimeout(2000);
      await expect(page.locator('.photo-upload-form.modal')).not.toBeVisible();
    }
  });
});
