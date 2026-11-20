import { expect, type Browser, type Page } from '@playwright/test';

export const VISUAL_WIDTHS = [1280, 390] as const;
export type VisualWidth = (typeof VISUAL_WIDTHS)[number];

/** Pinned so the clock, "Last login" and the heatmap's "today" can never change a baseline. */
export const VISUAL_NOW = new Date('2026-11-19T14:05:00-06:00');

export const slugFor = (route: string): string =>
  route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-');

/**
 * Opens `route` the way a visitor on that screen would see it: 1280px is a desktop window, 390px
 * is a touch phone. Resolves once fonts are in and the page has settled.
 */
export async function openForScreenshot(
  browser: Browser,
  baseURL: string,
  route: string,
  width: VisualWidth,
): Promise<Page> {
  const phone = width < 640;
  const context = await browser.newContext({
    baseURL,
    viewport: { width, height: phone ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: 'reduce',
    timezoneId: 'America/Chicago',
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(VISUAL_NOW);
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1').first()).toBeAttached();
  return page;
}

/** Things that legitimately differ between runs: the tmux clock and the build month. */
export const masks = (page: Page) => [page.locator('time'), page.getByTestId('build-date')];
