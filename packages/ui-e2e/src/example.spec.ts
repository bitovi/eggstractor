import { test, expect } from '@playwright/test';

test('Generate Styles button flow', async ({ page }) => {
  await page.goto('/');

  const generateBtn = page.locator('#generateBtn');

  // Button exists and has the right label
  await expect(generateBtn).toBeVisible();
  await expect(generateBtn).toHaveText(/^\s*Generate Styles\s*$/);

  // Click it
  await generateBtn.click();

  // Wait for the result text to appear
  await expect(page.getByText(/Generated SCSS Variables/)).toBeVisible({ timeout: 15000 });
});
