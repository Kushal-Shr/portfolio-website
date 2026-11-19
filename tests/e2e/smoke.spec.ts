import { expect, test } from '@playwright/test';
import { collectConsoleErrors, expectNoA11yViolations } from './utils';

test('home page loads cleanly', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByText('portfolio-sh')).toBeVisible();
  await expectNoA11yViolations(page);
  expect(errors).toEqual([]);
});
