import { expect, test, type Page } from '@playwright/test';
import { collectConsoleErrors, expectNoA11yViolations } from './utils';

// Touch behaviour on phones: the shell, the collapsed dock, the dashboard. Skipped on wide screens.
test.beforeEach(async ({ page }, info) => {
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width >= 640, `${info.project.name} is not a phone`);
});

const toggle = (page: Page) => page.getByRole('button', { name: 'command line' });

test.describe('the shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    await expect(page.locator('#cmd')).toBeEnabled();
  });

  test('does not pop the keyboard up on load', async ({ page }) => {
    await expect(page.locator('#cmd')).not.toBeFocused();
  });

  test('the chip bar shows at least 3 chips, and tapping one runs it', async ({ page }) => {
    const bar = page.locator('[data-scroll-x]').filter({ hasText: 'run:' });
    const visible = await bar
      .getByRole('button')
      .evaluateAll(
        (buttons, edge) => buttons.filter((b) => b.getBoundingClientRect().right <= edge).length,
        await bar.evaluate((el) => el.getBoundingClientRect().right),
      );
    expect(visible).toBeGreaterThanOrEqual(3);
    await bar.getByRole('button', { name: 'ls', exact: true }).tap();
    await expect(page.getByRole('log')).toContainText('projects/');
  });

  test('the title bar keeps the cwd and drops the window size', async ({ page }) => {
    await expect(page.locator('main')).toContainText('guest@portfolio: ~');
    await expect(page.getByText('portfolio-sh — 120×40')).toBeHidden();
  });

  test('the input is 16px, so iOS does not zoom on focus', async ({ page }) => {
    expect(await page.locator('#cmd').evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
  });
});

test.describe('the docked command line', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/zenith/');
  });

  test('is folded away until the nav bar’s >_ button is tapped', async ({ page }) => {
    await expect(page.locator('.dock')).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle(page)).toHaveAttribute('aria-controls', 'dock');

    await toggle(page).tap();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.dock')).toBeVisible();
    for (const chip of ['ls', 'cd ..', 'help', 'open resume']) {
      await expect(
        page
          .getByRole('group', { name: 'quick commands' })
          .getByRole('button', { name: chip, exact: true }),
      ).toBeVisible();
    }
    await toggle(page).tap();
    await expect(page.locator('.dock')).toBeHidden();
  });

  test('a chip runs, and the dock folds away again after a navigation', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await toggle(page).tap();
    await page
      .getByRole('group', { name: 'quick commands' })
      .getByRole('button', { name: 'cd ..', exact: true })
      .tap();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator('.dock')).toBeHidden();
    await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
    expect(errors).toEqual([]);
  });

  test('a chip that prints output opens the panel, which stays within half the screen', async ({
    page,
  }) => {
    await toggle(page).tap();
    await page
      .getByRole('group', { name: 'quick commands' })
      .getByRole('button', { name: 'help', exact: true })
      .tap();
    const log = page.getByRole('log', { name: 'portfolio-sh output' });
    await expect(log).toContainText('list files');
    const { height, viewport } = await log.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      viewport: innerHeight,
    }));
    expect(height).toBeLessThanOrEqual(viewport / 2 + 1);
  });

  test('the input is 16px and the prompt fits on one line', async ({ page }) => {
    await toggle(page).tap();
    expect(await page.locator('#dock-cmd').evaluate((el) => getComputedStyle(el).fontSize)).toBe(
      '16px',
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('is accessible expanded, and nothing sits behind it', async ({ page }) => {
    await toggle(page).tap();
    await expectNoA11yViolations(page);
    // scroll-padding follows the dock's real height, so focused things clear it.
    const padding = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom),
    );
    const group = await page
      .locator('.dock-group')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(padding).toBeGreaterThanOrEqual(group - 1);
  });
});

test.describe('the dashboard', () => {
  test('lists the projects directly above the README, and a tap brings the README into view', async ({
    page,
  }) => {
    await page.goto('/dashboard/');
    const list = await page.getByRole('button', { name: /zenith\// }).boundingBox();
    const readme = await page.locator('#readme').boundingBox();
    expect(list && readme && list.y < readme.y).toBe(true);
    await page.getByRole('button', { name: /surgipath\// }).tap();
    await expect(page.locator('#readme')).toContainText('surgipath');
    await expect(page.locator('#readme')).toBeInViewport();
  });

  test('is one column, with the portrait scaled to fit', async ({ page }) => {
    await page.goto('/dashboard/');
    const columns = await page
      .locator('#readme')
      .evaluate(
        (el) =>
          getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length,
      );
    expect(columns).toBe(1);
    const fits = await page
      .locator('[role="img"][aria-label^="ASCII portrait"]')
      .evaluate(
        (box) => (box.querySelector('pre') as HTMLElement).scrollWidth <= box.clientWidth + 1,
      );
    expect(fits).toBe(true);
  });
});

test.describe('the journey', () => {
  test('shows 13 weeks on a phone, and says so', async ({ page }) => {
    await page.goto('/journey/');
    const region = page.getByRole('region', { name: 'Activity over the last 13 weeks' });
    await expect(region).toContainText('in the last 13 weeks');
    await expect(region.getByRole('heading')).toHaveText(/last 13 weeks/);
  });
});
