import { expect, test } from '@playwright/test';
import { builtRoutes, expectNoHorizontalScroll, overflowingElements } from './utils';

// Runs in every device project (320, 390, 412, 768, 1024, 1280 and 1920px wide). The routes come
// from the built fs.json, so every new detail page is covered without editing this file.
test.describe('layout', () => {
  test('no page overflows sideways, and the current tab is in view', async ({ page, request }) => {
    test.setTimeout(240_000);
    const problems: string[] = [];
    for (const href of await builtRoutes(request)) {
      await page.goto(href);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 0) problems.push(`${href}: page scrolls sideways by ${overflow}px`);
      for (const el of await overflowingElements(page)) problems.push(`${href}: ${el}`);
    }
    expect(problems).toEqual([]);
  });

  test('the nav’s current tab is on screen', async ({ page }) => {
    for (const href of ['/', '/dashboard/', '/journey/', '/guide/', '/skills/python/']) {
      await page.goto(href);
      // On a phone the tabs scroll; the page's own tab is brought into the middle on load.
      await expect(
        page.locator('nav[aria-label="Pages"] [aria-current="page"]'),
        href,
      ).toBeInViewport({
        ratio: 1,
      });
    }
  });

  test('a box title never runs into its badge', async ({ page }) => {
    await page.goto('/projects/');
    const collisions = await page.evaluate(() => {
      const hits: string[] = [];
      for (const box of document.querySelectorAll('main article, main section')) {
        const title = box.querySelector(':scope > .box-title')?.getBoundingClientRect();
        const badge = box.querySelector(':scope > .box-badge')?.getBoundingClientRect();
        if (!title || !badge) continue;
        const apart = title.right <= badge.left || badge.right <= title.left;
        const stacked = title.bottom <= badge.top || badge.bottom <= title.top;
        if (!apart && !stacked) hits.push(box.id || box.className);
      }
      return hits;
    });
    expect(collisions).toEqual([]);
  });

  test('the shell’s own page fits too', async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    await expect(page.locator('#cmd')).toBeEnabled();
    await page.locator('#cmd').fill('neofetch');
    await page.locator('#cmd').press('Enter');
    await expect(
      page.getByRole('img', { name: 'ASCII portrait of Kushal Shrestha' }).last(),
    ).toBeAttached();
    await expectNoHorizontalScroll(page);
    expect(await overflowingElements(page)).toEqual([]);
    // The portrait scales to its box: all 72 columns show, none is cut off.
    const fits = await page.evaluate(() =>
      [...document.querySelectorAll('[role="img"][aria-label^="ASCII portrait"]')].every((box) => {
        const pre = box.querySelector('pre');
        return !!pre && pre.scrollWidth <= box.clientWidth + 1;
      }),
    );
    expect(fits).toBe(true);
  });
});
