// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Offline Page Content', () => {
  test('offline page should load', async ({ page }) => {
    await page.goto('/offline');
    await page.waitForLoadState('domcontentloaded');

    // Check page contains offline-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('offline');
  });

  test('offline page should have main content area', async ({ page }) => {
    await page.goto('/offline');
    await page.waitForLoadState('domcontentloaded');

    // Should have a div with content
    const mainDiv = await page.$('div');
    expect(mainDiv).not.toBeNull();
  });
});

test.describe('Network Status Detection', () => {
  test('should detect online status', async ({ page }) => {
    await page.goto('/');

    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });

  test('should detect offline status change', async ({ page, context }) => {
    await page.goto('/');

    // Verify initially online
    let isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);

    // Go offline
    await context.setOffline(true);

    // Check status changed
    isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(false);

    // Go back online
    await context.setOffline(false);

    isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });
});

test.describe('Browser Offline Mode', () => {
  test('should be able to set browser offline', async ({ page, context }) => {
    await page.goto('/');

    // This verifies the context.setOffline API works
    await context.setOffline(true);

    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    await context.setOffline(false);
  });

  test('should be able to toggle offline mode', async ({ page, context }) => {
    await page.goto('/');

    // Toggle offline multiple times
    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    await context.setOffline(false);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);

    await context.setOffline(true);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);

    await context.setOffline(false);
  });
});
