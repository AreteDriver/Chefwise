// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PWA Foundation', () => {
  test('should have a valid web manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('ChefWise - AI Cooking Assistant');
    expect(manifest.short_name).toBe('ChefWise');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#10B981');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have manifest link in document head', async ({ page }) => {
    await page.goto('/');
    const manifestLink = await page.$('link[rel="manifest"]');
    expect(manifestLink).not.toBeNull();

    const href = await manifestLink.getAttribute('href');
    expect(href).toBe('/manifest.json');
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const themeColor = await page.$('meta[name="theme-color"]');
    expect(themeColor).not.toBeNull();

    const content = await themeColor.getAttribute('content');
    expect(content).toBe('#10B981');
  });

  test('should have apple-mobile-web-app meta tags', async ({ page }) => {
    await page.goto('/');

    const capable = await page.$('meta[name="apple-mobile-web-app-capable"]');
    expect(capable).not.toBeNull();

    const statusBar = await page.$('meta[name="apple-mobile-web-app-status-bar-style"]');
    expect(statusBar).not.toBeNull();
  });

  test('should have service worker file', async ({ page }) => {
    const response = await page.goto('/service-worker.js');
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('javascript');
  });

  test('should have PWA icons available', async ({ page }) => {
    // Check a few key icon sizes
    const iconSizes = ['72', '192', '512'];

    for (const size of iconSizes) {
      const response = await page.goto(`/icons/icon-${size}.png`);
      expect(response.status()).toBe(200);
    }
  });
});
