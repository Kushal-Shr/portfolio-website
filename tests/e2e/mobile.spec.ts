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

test.describe('the nav bar', () => {
  const nav = (page: Page) => page.getByRole('navigation', { name: 'Pages', exact: true });
  const menu = (page: Page) => nav(page).getByRole('button', { name: 'menu' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/experience/');
    await expect(menu(page)).toBeVisible();
  });

  test('shows only the current tab, and never scrolls sideways', async ({ page }) => {
    await expect(nav(page).getByRole('link')).toHaveCount(1);
    await expect(nav(page).getByRole('link')).toHaveText('4:experience*');
    expect(await nav(page).evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(
      0,
    );
  });

  test('menu opens every tab on screen, and a tap goes there and closes it', async ({ page }) => {
    await menu(page).tap();
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'true');
    const links = nav(page).getByRole('link');
    await expect(links).toHaveCount(10);
    for (const link of await links.all()) {
      await expect(link).toBeInViewport({ ratio: 1 });
      expect((await link.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
    // The open grid covers the page on purpose, so only the nav is checked.
    await expectNoA11yViolations(page, 'nav[aria-label="Pages"]');
    await nav(page).getByRole('link', { name: '8:journey' }).tap();
    await expect(page).toHaveURL(/\/journey\/$/);
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(nav(page).getByRole('link')).toHaveCount(1);
  });

  test('a tap outside closes the menu', async ({ page }) => {
    await menu(page).tap();
    await page.locator('main').tap({ position: { x: 10, y: 10 } });
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes the menu and hands focus back to its button', async ({ page }) => {
    await menu(page).click();
    await expect(nav(page).getByRole('link', { name: '4:experience*' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(menu(page)).toBeFocused();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the nav falls back to tabs that scroll sideways', async ({ page }) => {
    await page.goto('/experience/');
    const nav = page.getByRole('navigation', { name: 'Pages', exact: true });
    await expect(nav.getByRole('button', { name: 'menu' })).toBeHidden();
    await expect(nav.getByRole('link')).toHaveCount(10);
  });
});

test.describe('nothing scrolls sideways', () => {
  test('diagrams shrink to fit their box, but never below 9px', async ({ page }) => {
    await page.goto('/projects/');
    const boxes = await page.locator('.diagram-fit [data-scroll-x]').evaluateAll((els) =>
      els.map((el) => ({
        overflow: el.scrollWidth - el.clientWidth,
        size: parseFloat(getComputedStyle(el.querySelector('pre') ?? el).fontSize),
      })),
    );
    expect(boxes.length).toBeGreaterThan(0);
    for (const { size } of boxes) expect(size).toBeGreaterThanOrEqual(9);
    // Narrower than a 375px phone, a diagram that would go below 9px scrolls instead.
    if ((page.viewportSize()?.width ?? 0) < 375) return;
    for (const { overflow } of boxes) expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the resume is wrapped to the screen', async ({ page }) => {
    await page.goto('/resume/');
    const resume = page.locator('pre.resume-text').filter({ visible: true });
    const box = await resume.boundingBox();
    expect(box && box.x + box.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
    await expect(resume).toContainText('Webster University');
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
