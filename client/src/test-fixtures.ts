import { test as base, Page } from '@playwright/test';

/**
 * Helper function to remove webpack dev server overlay
 */
async function removeWebpackOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    if (overlay) {
      overlay.remove();
    }
    // Also hide it via CSS as a backup
    const style = document.createElement('style');
    style.textContent = '#webpack-dev-server-client-overlay { display: none !important; }';
    document.head.appendChild(style);
  }).catch(() => {});
}

/**
 * Extended test fixture that removes webpack dev server overlay
 * This prevents the overlay from blocking clicks during tests
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Remove webpack overlay on every page load
    page.on('load', async () => {
      await removeWebpackOverlay(page);
    });

    // Also set up a MutationObserver to remove overlay if it appears dynamically
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) {
          overlay.remove();
        }
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, { childList: true, subtree: true });
        });
      }
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
