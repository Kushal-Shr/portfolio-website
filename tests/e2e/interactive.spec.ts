import { expect, test } from '@playwright/test';
import { collectConsoleErrors, expectNoA11yViolations } from './utils';

const box = (page: import('@playwright/test').Page, key: string) =>
  page.locator(`[data-section="${key}"]`);

test.describe('skills', () => {
  test('clicking cloud hides the other boxes and syncs the URL', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/skills/');
    await expect(page.getByRole('button', { name: 'all' })).toHaveAttribute('aria-pressed', 'true');
    for (const key of ['languages', 'ai-data', 'cloud']) await expect(box(page, key)).toBeVisible();

    await page.getByRole('button', { name: 'cloud' }).click();
    await expect(page.getByRole('button', { name: 'cloud' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'all' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(box(page, 'cloud')).toBeVisible();
    await expect(box(page, 'languages')).toBeHidden();
    await expect(box(page, 'ai-data')).toBeHidden();
    await expect(page).toHaveURL(/\?section=cloud$/);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  test('the remaining box moves into the first grid column', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'desktop grid');
    await page.goto('/skills/');
    const grid = await page.locator('main .grid').first().boundingBox();
    await page.getByRole('button', { name: 'cloud' }).click();
    const cloud = await box(page, 'cloud').boundingBox();
    expect(Math.abs((cloud?.x ?? 0) - (grid?.x ?? 99))).toBeLessThan(2);
  });

  test('loading ?section=ai-data pre-selects it', async ({ page }) => {
    await page.goto('/skills/?section=ai-data');
    await expect(page.getByRole('button', { name: 'ai-data' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(box(page, 'ai-data')).toBeVisible();
    await expect(box(page, 'cloud')).toBeHidden();
  });

  test('all restores everything and drops the parameter', async ({ page }) => {
    await page.goto('/skills/?section=cloud');
    await page.getByRole('button', { name: 'all' }).click();
    for (const key of ['languages', 'ai-data', 'cloud']) await expect(box(page, key)).toBeVisible();
    expect(page.url()).not.toContain('section=');
  });

  test('announces the change in a polite live region', async ({ page }) => {
    await page.goto('/skills/');
    const live = page.locator('main [aria-live="polite"]');
    await expect(live).toHaveText('Showing all 25 packages');
    await page.getByRole('button', { name: 'cloud' }).click();
    await expect(live).toHaveText('Showing 8 packages in cloud');
    await page.getByRole('button', { name: 'languages' }).click();
    await expect(live).toHaveText('Showing 10 packages in languages');
  });

  test('buttons work from the keyboard', async ({ page }) => {
    await page.goto('/skills/');
    await page.getByRole('button', { name: 'ai-data' }).focus();
    await page.keyboard.press('Enter');
    await expect(box(page, 'cloud')).toBeHidden();
    await page.getByRole('button', { name: 'cloud' }).focus();
    await page.keyboard.press('Space');
    await expect(box(page, 'cloud')).toBeVisible();
  });

  test('reduced motion shows a static spinner', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-reduced-motion', 'reduced-motion project only');
    await page.goto('/skills/');
    await expect(page.locator('main').getByText('⠿')).toHaveCount(2);
    // A negative check: the real spinner would have changed frame within 90ms, so 400ms is plenty.
    await page.waitForTimeout(400);
    await expect(page.locator('main').getByText('⠿')).toHaveCount(2);
  });

  test('the spinner animates otherwise', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop-reduced-motion', 'animation only');
    await page.goto('/skills/');
    await expect(page.locator('main').getByText('⠿')).toHaveCount(0, { timeout: 2000 });
  });

  test('every spinner on the page shares one timer', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop-reduced-motion', 'animation only');
    // The prompt's typewriter has timers of its own, so count only the spinner's 90ms ones.
    await page.addInitScript(() => {
      const live = new Map<number, number>();
      const set = window.setInterval.bind(window);
      const clear = window.clearInterval.bind(window);
      window.setInterval = ((fn: TimerHandler, ms?: number) => {
        const id = set(fn, ms);
        live.set(id, ms ?? 0);
        return id;
      }) as typeof window.setInterval;
      window.clearInterval = ((id?: number) => {
        live.delete(Number(id));
        clear(id);
      }) as typeof window.clearInterval;
      (window as unknown as { __spinners: () => number }).__spinners = () =>
        [...live.values()].filter((ms) => ms === 90).length;
    });
    await page.goto('/skills/');
    await expect(page.locator('main').getByText('⠿')).toHaveCount(0, { timeout: 2000 });
    expect(
      await page.evaluate(() => (window as unknown as { __spinners: () => number }).__spinners()),
    ).toBe(1);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('every section is visible', async ({ page }) => {
      await page.goto('/skills/?section=cloud');
      for (const key of ['languages', 'ai-data', 'cloud'])
        await expect(box(page, key)).toBeVisible();
    });
  });
});

test.describe('guide', () => {
  test('clicking a summary opens it and shows engine output', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/guide/');
    const details = page.locator('details', { hasText: 'tree' }).first();
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('pre')).toContainText('├── dashboard/');
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  test('the keyboard toggles it', async ({ page }) => {
    await page.goto('/guide/');
    const summary = page.locator('summary', { hasText: 'neofetch' });
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await expect(summary.locator('..').locator('pre')).toContainText('Kushal Shrestha');
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open', '');
  });

  test('"run it in the shell" for tree lands on the shell with the tree', async ({ page }) => {
    await page.goto('/guide/');
    const details = page.locator('details', { hasText: '$ tree' });
    await details.locator('summary').click();
    await details.getByRole('link', { name: '▶ run it in the shell' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('log')).toContainText(/\d+ directories, \d+ files/);
  });

  test('shows real outputs from the shell engine', async ({ page }) => {
    await page.goto('/guide/');
    await page.locator('summary', { hasText: 'clear' }).click();
    await expect(page.locator('details', { hasText: 'clear' }).locator('pre')).toContainText(
      '3  cd projects',
    );
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('details still open on click', async ({ page }) => {
      await page.goto('/guide/');
      const details = page.locator('details', { hasText: 'help' }).first();
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await expect(details.locator('pre')).toContainText('ls [dir]');
    });
  });
});
