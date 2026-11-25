import { expect, test } from '@playwright/test';
import { ROUTES } from '../../lib/routes';
import {
  collectConsoleErrors,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
  openNavMenu,
} from './utils';

for (const route of ROUTES) {
  test(`route ${route.href} is a well-formed page`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(route.href);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);

    await openNavMenu(page);
    const links = page.getByRole('navigation', { name: 'Pages' }).getByRole('link');
    await expect(links).toHaveCount(10);
    const current = page.locator('nav[aria-label="Pages"] [aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText(`${ROUTES.indexOf(route)}:${route.label}*`);
    expect(errors).toEqual([]);
  });
}

test('nav links navigate', async ({ page }) => {
  await page.goto('/');
  await openNavMenu(page);
  await page
    .getByRole('navigation', { name: 'Pages' })
    .getByRole('link', { name: /projects/ })
    .click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('nav [aria-current="page"]')).toContainText('3:projects*');
});

test('skip link is the first tab stop and focuses #content', async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(isMobile, 'keyboard navigation is checked on desktop');
  // Safari's default (System Settings → Keyboard) leaves links out of the Tab order; Option+Tab adds them.
  test.skip(browserName === 'webkit', 'desktop Safari does not Tab to links by default');
  await page.goto('/about/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();
});

test('prompt types out and finishes within 2s, or shows at once under reduced motion', async ({
  page,
}, testInfo) => {
  await page.goto('/about/');
  const command = page.getByTestId('prompt-command');
  if (testInfo.project.name === 'desktop-reduced-motion') {
    await expect(command).toBeVisible();
    await expect(command).toHaveText('man kushal');
  } else {
    await expect(command).toHaveText('man kushal', { timeout: 2000 });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('prompt command is fully visible on /about/', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByTestId('prompt-command')).toBeVisible();
    await expect(page.getByTestId('prompt-command')).toHaveText('man kushal');
  });
});
