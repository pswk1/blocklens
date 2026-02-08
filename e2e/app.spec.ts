import { test, expect } from '@playwright/test';

test.describe('BlockLens', () => {
  test('shows validation error for invalid time format', async ({ page }) => {
    await page.goto('/');

    // Find the Goal Time input and enter invalid text
    const goalTimeInput = page.locator('input[placeholder="M:SS or H:MM:SS"]').first();
    await goalTimeInput.fill('abc');

    // Error message should appear
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('unit toggle switches between miles and kilometers', async ({ page }) => {
    await page.goto('/');

    // Default is miles
    await expect(page.locator('.unit-btn.active')).toContainText('Miles');

    // Click Kilometers button
    await page.click('button:has-text("Kilometers")');

    // Kilometers should now be active
    await expect(page.locator('.unit-btn.active')).toContainText('Kilometers');
  });

  test('inputs persist after page reload', async ({ page }) => {
    await page.goto('/');

    const goalTimeInput = page.locator('input[placeholder="M:SS or H:MM:SS"]').first();

    // Enter a custom time
    await goalTimeInput.fill('4:00:00');

    // Wait for localStorage save
    await page.waitForTimeout(100);

    // Reload and check persistence
    await page.reload();
    await expect(goalTimeInput).toHaveValue('4:00:00');
  });

  test('weather toggle shows inputs and affects projection', async ({ page }) => {
    await page.goto('/');

    // Weather inputs should be hidden initially
    await expect(page.locator('.weather-inputs')).not.toBeVisible();

    // Enable weather adjustment
    await page.click('label[for="weather-enabled"]');

    // Weather inputs should now be visible
    await expect(page.locator('.weather-inputs')).toBeVisible();

    // Temperature slider should be present
    await expect(page.locator('#temperature')).toBeVisible();

    // Humidity buttons should be present
    await expect(page.locator('.humidity-toggle')).toBeVisible();

    // Set temperature to hot (slide to high value)
    const tempSlider = page.locator('#temperature');
    await tempSlider.fill('85');

    // Weather impact indicator should appear in results
    await expect(page.locator('.weather-impact')).toBeVisible();
    await expect(page.locator('.weather-text')).toContainText('Weather:');
  });
});
