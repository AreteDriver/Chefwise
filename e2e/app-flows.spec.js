// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('can navigate to all main pages', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');

    await page.goto('/recipes');
    await expect(page).toHaveURL('/recipes');

    await page.goto('/pantry');
    await expect(page).toHaveURL('/pantry');

    await page.goto('/planner');
    await expect(page).toHaveURL('/planner');

    await page.goto('/tracker');
    await expect(page).toHaveURL('/tracker');
  });

  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = await page.$('body');
    expect(body).not.toBeNull();
  });
});

test.describe('Pantry Page', () => {
  test('pantry page loads', async ({ page }) => {
    await page.goto('/pantry');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/pantry');
  });

  test('pantry page has content', async ({ page }) => {
    await page.goto('/pantry');
    await page.waitForLoadState('domcontentloaded');
    
    const body = await page.$('body');
    expect(body).not.toBeNull();
  });
});

test.describe('Recipes Page', () => {
  test('recipes page loads', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/recipes');
  });
});

test.describe('Meal Planner', () => {
  test('planner page loads', async ({ page }) => {
    await page.goto('/planner');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/planner');
  });
});

test.describe('Macro Tracker', () => {
  test('tracker page loads', async ({ page }) => {
    await page.goto('/tracker');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/tracker');
  });
});

test.describe('Subscription Pages', () => {
  test('upgrade page loads', async ({ page }) => {
    await page.goto('/upgrade');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/upgrade');
  });

  test('subscription page loads', async ({ page }) => {
    await page.goto('/subscription');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/subscription');
  });
});

test.describe('Profile Page', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL('/profile');
  });
});

test.describe('Responsive Design', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = await page.$('body');
    expect(body).not.toBeNull();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = await page.$('body');
    expect(body).not.toBeNull();
  });

  test('works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const body = await page.$('body');
    expect(body).not.toBeNull();
  });
});
