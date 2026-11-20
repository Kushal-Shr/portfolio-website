import { expect, test } from '@playwright/test';
import { masks, openForScreenshot, slugFor, VISUAL_WIDTHS } from './visual-shared';

// Every section route, plus one detail page of each type. Skill pages are many and identical in
// shape, so one of them stands for all.
const ROUTES = [
  '/',
  '/dashboard/',
  '/about/',
  '/projects/',
  '/experience/',
  '/leadership/',
  '/skills/',
  '/resume/',
  '/journey/',
  '/guide/',
  '/projects/zenith/',
  '/experience/schnuck/',
  '/leadership/president/',
  '/leadership/achievements/',
  '/leadership/achievements/hackfest-2025/',
  '/skills/python/',
];

for (const width of VISUAL_WIDTHS) {
  for (const route of ROUTES) {
    test(`${route} @${width}`, async ({ browser, baseURL }) => {
      const page = await openForScreenshot(browser, baseURL ?? '', route, width);
      await expect(page).toHaveScreenshot(`${slugFor(route)}-${width}.png`, {
        fullPage: true,
        mask: masks(page),
      });
      await page.context().close();
    });
  }
}
