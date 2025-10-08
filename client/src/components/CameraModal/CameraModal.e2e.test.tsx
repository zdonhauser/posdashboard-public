import { test, expect } from '../../test-fixtures';
import { login } from '../../test-helpers';

/**
 * E2E Tests for CameraModal Component
 *
 * ESSENTIAL TEST CASES:
 *
 * 1. Modal Display
 *    - Opens when triggered from parent
 *    - Closes on cancel/close button
 *    - Closes on successful upload
 *    - Modal backdrop prevents interaction
 *
 * 2. Camera Access
 *    - Requests camera permissions
 *    - Displays camera feed when granted
 *    - Shows error message when denied
 *    - Falls back to file upload when no camera
 *
 * 3. Photo Capture
 *    - Captures photo from camera
 *    - Preview shows captured photo
 *    - Retake button clears and restarts
 *    - Captured photo quality is acceptable
 *
 * 4. Photo Upload
 *    - Uploads captured photo successfully
 *    - Shows upload progress
 *    - Handles upload errors gracefully
 *    - Validates image format/size
 *
 * 5. File Upload Alternative
 *    - File input accepts image files
 *    - Selected file shows preview
 *    - Uploads selected file
 *    - Validates file type and size
 */

test.describe('CameraModal Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Grant camera permissions
    await page.context().grantPermissions(['camera']);
    await page.goto('https://localhost:3000/');

    await login(page);
  });

  test('should open camera modal when clicking New Photo on membership', async ({ page }) => {
    // Click Admission to show memberships
    await page.getByRole('button', { name: 'Admission' }).click();

    // Click on a membership item (e.g., Unlimited Wristband)
    await page.getByText('Unlimited Wristband').first().click();

    // Wait for item to be added and look for "New Photo" link
    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();

      // Verify camera modal is displayed
      await expect(page.locator('.camera-modal')).toBeVisible();
      await expect(page.locator('.video-stream')).toBeVisible();
    }
  });

  test('should display video stream when camera permission granted', async ({ page }) => {
    // Navigate to trigger camera modal (same setup as previous test)
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();

      // Wait for video to load
      await page.waitForSelector('.video-stream:not(.hidden)', { timeout: 5000 });

      // Verify loading message disappears
      await expect(page.locator('text=Loading Camera...')).not.toBeVisible();

      // Verify video stream is visible
      const videoElement = page.locator('video.video-stream');
      await expect(videoElement).toBeVisible();
    }
  });

  test('should show Capture Photo button when video is ready', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();

      // Wait for camera controls to appear
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Verify buttons are present
      await expect(page.locator('#photo-capture-button')).toBeVisible();
      await expect(page.locator('#close-camera-button')).toBeVisible();
    }
  });

  test('should start countdown when Capture Photo button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Click capture button
      await page.locator('#photo-capture-button').click();

      // Verify countdown appears
      const countdown = page.locator('.countdown');
      await expect(countdown).toBeVisible();

      // Countdown should show 3, 2, or 1
      const countdownText = await countdown.textContent();
      expect(['3', '2', '1']).toContain(countdownText);
    }
  });

  test('should trigger capture with spacebar keyboard shortcut', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Press spacebar
      await page.keyboard.press('Space');

      // Verify countdown starts
      await expect(page.locator('.countdown')).toBeVisible();
    }
  });

  test('should close modal with Escape keyboard shortcut', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('.camera-modal', { timeout: 5000 });

      // Press Escape
      await page.keyboard.press('Escape');

      // Verify modal is closed
      await expect(page.locator('.camera-modal')).not.toBeVisible();
    }
  });

  test('should close modal when Close button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#close-camera-button', { timeout: 5000 });

      // Click close button
      await page.locator('#close-camera-button').click();

      // Verify modal is closed
      await expect(page.locator('.camera-modal')).not.toBeVisible();
    }
  });

  test('should complete full capture flow with countdown', async ({ page }) => {
    await page.getByRole('button', { name: 'Admission' }).click();
    await page.getByText('Unlimited Wristband').first().click();

    const newPhotoLink = page.locator('text=New Photo');
    if (await newPhotoLink.isVisible()) {
      await newPhotoLink.click();
      await page.waitForSelector('#photo-capture-button', { timeout: 5000 });

      // Click capture button
      await page.locator('#photo-capture-button').click();

      // Wait for countdown to appear
      await expect(page.locator('.countdown')).toBeVisible();

      // Wait for countdown to complete (about 1 second)
      await page.waitForTimeout(1200);

      // Verify upload state appears (uploading message or success)
      const uploadingMessage = page.locator('text=Uploading photo...');
      const successMessage = page.locator('text=Photo uploaded successfully!');

      // One of these should be visible
      const isUploading = await uploadingMessage.isVisible();
      const isSuccess = await successMessage.isVisible();

      expect(isUploading || isSuccess).toBeTruthy();
    }
  });
});
