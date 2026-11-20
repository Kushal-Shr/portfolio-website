import AxeBuilder from '@axe-core/playwright';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export async function expectNoA11yViolations(page: Page): Promise<void> {
  // The dock and nav are one sticky group over the viewport's bottom edge; at scroll-top it hides
  // whatever sits behind it, and axe reports covered targets. At the page end it sits below the content.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const report = violations
    .map((v) => {
      const targets = v.nodes.map((n) => `    ${n.target.join(' ')}`).join('\n');
      return `${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n${targets}`;
    })
    .join('\n');
  expect(violations, `Accessibility violations:\n${report}`).toEqual([]);
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

type FsJson = Record<string, { type: 'dir' | 'file'; route?: string; children?: string[] }>;

/** The built filesystem the dock loads: the site tree as this build saw it, journey included. */
export async function builtFs(request: APIRequestContext): Promise<FsJson> {
  const res = await request.get('/fs.json');
  expect(res.ok()).toBe(true);
  return (await res.json()) as FsJson;
}

/** Every page route in the build, from `fs.json` (so journey permalinks are included). */
export async function builtRoutes(request: APIRequestContext): Promise<string[]> {
  const fs = await builtFs(request);
  return [...new Set(Object.values(fs).flatMap((n) => (n.route ? [n.route] : [])))].sort();
}

/** Every route answers 200 with exactly one `<h1>`. */
export async function crawl(page: Page, routes: readonly string[]): Promise<void> {
  for (const href of routes) {
    const response = await page.goto(href);
    expect(response?.status(), href).toBe(200);
    await expect(page.locator('h1'), href).toHaveCount(1);
  }
}
