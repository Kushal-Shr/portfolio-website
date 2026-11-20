import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

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
