// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('IndexedDB Availability', () => {
  test('IndexedDB should be available in browser', async ({ page }) => {
    await page.goto('/');

    const hasIndexedDB = await page.evaluate(() => {
      return 'indexedDB' in window;
    });

    expect(hasIndexedDB).toBe(true);
  });

  test('should be able to open IndexedDB database', async ({ page }) => {
    await page.goto('/');

    const canOpenDB = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const request = indexedDB.open('test-db', 1);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('test-db');
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(canOpenDB).toBe(true);
  });
});

test.describe('Home Page', () => {
  test('home page should load', async ({ page }) => {
    await page.goto('/');

    // Should show the ChefWise branding somewhere on page
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('chefwise');
  });

  test('home page should have html structure', async ({ page }) => {
    await page.goto('/');

    const body = await page.$('body');
    expect(body).not.toBeNull();
  });
});

test.describe('Offline Page', () => {
  test('offline page should be accessible', async ({ page }) => {
    await page.goto('/offline');

    // Should load without error
    expect(page.url()).toContain('/offline');
  });

  test('offline page should have offline content', async ({ page }) => {
    await page.goto('/offline');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check page has offline-related content
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('offline');
  });
});

test.describe('Static Assets', () => {
  test('CSS file should be loadable', async ({ page }) => {
    // Check that Next.js includes style links in the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for style or link elements
    const hasStyleElements = await page.evaluate(() => {
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      return styles.length > 0;
    });

    expect(hasStyleElements).toBe(true);
  });

  test('favicon should be available', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    expect([200, 304]).toContain(response.status());
  });
});
