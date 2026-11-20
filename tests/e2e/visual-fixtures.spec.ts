import { expect, test } from '@playwright/test';
import { masks, openForScreenshot, slugFor, VISUAL_WIDTHS } from './visual-shared';

// The populated journey, from the second build (fake fixture entries).
const ROUTES = ['/journey/', '/journey/2026-11-19/'];

for (const width of VISUAL_WIDTHS) {
  for (const route of ROUTES) {
    test(`fixtures ${route} @${width}`, async ({ browser, baseURL }) => {
      const page = await openForScreenshot(browser, baseURL ?? '', route, width);
      await expect(page).toHaveScreenshot(`fixtures-${slugFor(route)}-${width}.png`, {
        fullPage: true,
        mask: masks(page),
      });
      await page.context().close();
    });
  }
}
