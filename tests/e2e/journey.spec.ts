import { expect, test } from '@playwright/test';
import {
  builtFs,
  collectConsoleErrors,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
} from './utils';

// Runs against the real content, which may still be empty (launch day). Once Kushal has posted,
// the populated page is covered by journey-fixtures.spec.ts and the crawl in site.spec.ts.
test.describe('journey with the real content', () => {
  test.beforeEach(async ({ request }) => {
    const journey = (await builtFs(request))['~/journey'];
    const entries = (journey?.children ?? []).filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c));
    test.skip(entries.length > 0, 'there are real entries: the empty state is gone');
  });

  test('shows a deliberate empty state', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/journey/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '~/journey  ·  what I learned and built, every single day',
    );
    await expect(page.getByTestId('journey-stats')).toHaveText(
      'day 0 · streak 0 days · journey.rss',
    );
    const heatmap = page.getByRole('region', { name: 'Activity over the last 26 weeks' });
    await expect(heatmap).toContainText('0 entries in the last 26 weeks.');
    await expect(heatmap.locator('[data-logged]')).toHaveCount(0);
    await expect(page.getByTestId('journey-empty')).toHaveText(
      /tail: ~\/journey\/log: no entries yet — the first one lands soon/,
    );
    await expect(page.locator('article')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  test('serves an empty but valid feed, linked from the page', async ({ page, request }) => {
    const res = await request.get('/journey/rss.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const xml = await res.text();
    expect(xml).toContain('<title>Kushal Shrestha — ~/journey</title>');
    expect(xml).not.toContain('<item>');
    await page.goto('/journey/');
    await expect(page.getByRole('link', { name: 'journey.rss' })).toHaveAttribute(
      'href',
      '/journey/rss.xml',
    );
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(1);
  });

  test('the archive says there is nothing yet', async ({ page }) => {
    await page.goto('/journey/archive/');
    await expect(page.locator('main')).toContainText('archive.log: no entries yet');
    await expectNoA11yViolations(page);
  });

  test('tail journey in the shell says so too', async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    await expect(page.locator('#cmd')).toBeEnabled();
    await page.locator('#cmd').fill('tail journey');
    await page.locator('#cmd').press('Enter');
    await expect(page.getByRole('log')).toContainText('tail: ~/journey: no entries yet');
  });
});
