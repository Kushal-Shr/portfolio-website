import { expect, test, type Page } from '@playwright/test';
import {
  builtRoutes,
  collectConsoleErrors,
  crawl,
  expectNoA11yViolations,
  expectNoHorizontalScroll,
} from './utils';

// Runs against the second build made from tests/fixtures/journey (fake data, 38 entries from
// 2026-10-05 to 2026-11-19). The viewer's clock is pinned so the heatmap and streak are stable.
const viewOn = async (page: Page, isoDay: string) => {
  await page.clock.setFixedTime(new Date(`${isoDay}T12:00:00-06:00`));
};

// The grid shows 26 weeks, or 13 on a phone (the fixtures all fall inside the newest 13).
const weeksFor = (page: Page) => ((page.viewportSize()?.width ?? 1280) < 640 ? 13 : 26);
const heatmap = (page: Page) =>
  page.getByRole('region', { name: `Activity over the last ${weeksFor(page)} weeks` });

test.describe('the populated journey', () => {
  test('/journey shows the heatmap, the stats and the newest 30 entries', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await viewOn(page, '2026-11-20');
    await page.goto('/journey/');
    await expect(page.getByTestId('journey-stats')).toHaveText(
      'day 47 · streak 10 days · journey.rss',
    );
    await expect(heatmap(page).locator('[data-logged]')).toHaveCount(38);
    await expect(heatmap(page)).toContainText(
      `38 entries in the last ${weeksFor(page)} weeks. Current streak 10 days. Longest streak 10 days.`,
    );
    const articles = page.locator('main article');
    await expect(articles).toHaveCount(30);
    await expect(articles.first().getByRole('heading', { level: 2 })).toHaveText(
      /^── day 46 · Thu Nov 19 2026/,
    );
    await expect(articles.first()).toContainText('stuck on');
    await expect(articles.first()).toContainText('#fixture #test-data');
    await expect(articles.first().locator('.prose-term h3')).toHaveText('Notes heading');
    // The tricky entry is shown as text, never as markup.
    await expect(page.locator('#\\32 026-11-18')).toContainText('A&B <b>not bold</b>.');
    await expect(page.getByRole('link', { name: 'ls ~/journey/archive' })).toBeVisible();
    await expect(page.locator('main')).toContainText("tail: waiting for tomorrow's entry");
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  test("recomputes the streak and day from the viewer's today, not the build's", async ({
    page,
  }) => {
    await viewOn(page, '2026-11-23');
    await page.goto('/journey/');
    await expect(page.getByTestId('journey-stats')).toHaveText(
      'day 50 · streak 0 days · longest 10 days · journey.rss',
    );
  });

  test('an entry heading opens its permalink, and the trail pages through', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/journey/');
    await page.getByRole('link', { name: 'day 46 · Thu Nov 19 2026' }).click();
    await expect(page).toHaveURL(/\/journey\/2026-11-19\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /^── day 46 · Thu Nov 19 2026/,
    );
    await expect(page.locator('main')).toContainText('~/journey/2026-11-19');
    await expect(page.locator('main')).toContainText('cat README.md');
    await expect(page).toHaveTitle(/^day 46 · 2026-11-19/);
    await expect(page.getByRole('link', { name: /example\.com\/fixture\/newest/ })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);

    const trail = page.getByRole('navigation', { name: 'journey pages' });
    await expect(trail.getByRole('link', { name: /next/ })).toHaveCount(0);
    await expect(trail.getByRole('link', { name: /prev/ })).toHaveAttribute(
      'href',
      '/journey/2026-11-18/',
    );
    await expect(trail.getByRole('link', { name: 'cd ..' })).toHaveAttribute('href', '/journey/');
    expect(errors).toEqual([]);
    await trail.getByRole('link', { name: /prev/ }).click();
    await expect(page).toHaveURL(/\/journey\/2026-11-18\/$/);
    await trail.getByRole('link', { name: /next/ }).click();
    await expect(page).toHaveURL(/\/journey\/2026-11-19\/$/);
    await trail.getByRole('link', { name: 'cd ..' }).click();
    await expect(page).toHaveURL(/\/journey\/$/);
    expect(errors).toEqual([]);
  });

  test('the archive lists every entry by month', async ({ page }) => {
    await page.goto('/journey/archive/');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      '# November 2026',
      '# October 2026',
    ]);
    await expect(page.locator('main li')).toHaveCount(38);
    await expect(page.locator('main li').first()).toHaveText(
      /^2026-11-19 {2}day 46 {2}learned: FAKE FIXTURE/,
    );
    await expectNoHorizontalScroll(page);
    await expectNoA11yViolations(page);
  });

  test('rss.xml is served as XML with an item per entry', async ({ request }) => {
    const res = await request.get('/journey/rss.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const xml = await res.text();
    expect(xml.match(/<item>/g)).toHaveLength(38);
    expect(xml).toContain('<guid isPermaLink="true">');
    expect(xml).toContain('&amp;lt;tags&amp;gt;'); // `<tags>`: escaped for HTML, then for XML
  });

  test('every page, permalinks included, returns 200 with one <h1>', async ({
    page,
    request,
  }, info) => {
    test.skip(info.project.name !== 'journey-fixtures', 'one crawl is enough');
    test.setTimeout(120_000);
    const routes = await builtRoutes(request);
    const permalinks = routes.filter((r) => /^\/journey\/\d{4}-\d{2}-\d{2}\/$/.test(r));
    expect(permalinks).toHaveLength(38);
    expect(routes).toContain('/journey/archive/');
    await crawl(page, routes);
  });
});

test.describe('the journey in the shell', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== 'journey-fixtures', 'keyboard-driven, desktop only');
  });

  test('tail journey on the home shell shows the newest fixture', async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    const input = page.locator('#cmd');
    await expect(input).toBeEnabled();
    await input.fill('tail journey');
    await input.press('Enter');
    const log = page.getByRole('log');
    await expect(log).toContainText('==> ~/journey/2026-11-19/README.md <==');
    await expect(log).toContainText('learned  FAKE FIXTURE: the newest test entry');
    await expect(log.getByRole('link', { name: 'open the full journey log' })).toBeVisible();
  });

  test('cd <date> in the dock on /journey/ lands on the permalink', async ({ page }) => {
    await page.goto('/journey/');
    await expect(page.locator('.dock')).toBeVisible();
    await page.keyboard.press(':');
    await expect(page.locator('#dock-cmd')).toBeFocused();
    await page.keyboard.type('cd 2026-11-02');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/journey\/2026-11-02\/$/);
    await expect(page.locator('.dock label')).toContainText('~/journey/2026-11-02');
    await page.keyboard.type('open archive');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/journey\/archive\/$/);
    await expect(page.locator('.dock label')).toContainText('~/journey');
  });
});
