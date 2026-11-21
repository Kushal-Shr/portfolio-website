import { expect, test } from '@playwright/test';

// Input latency with a long scrollback, and no layout shift from the typed text.
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'timing: one project is enough');
});

test('typing stays fast after 200 commands (keystroke to paint under 50ms)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
  await page.goto('/');
  const input = page.locator('#cmd');
  await expect(input).toBeEnabled();

  for (let i = 0; i < 200; i++) {
    await input.fill(`echo run ${i}`);
    await input.press('Enter');
  }
  await expect(page.getByRole('log')).toContainText('run 199');

  // Time each keystroke from the keydown to the frame after the input has been painted.
  await page.evaluate(() => {
    const times: number[] = [];
    (window as unknown as { __latency: number[] }).__latency = times;
    let start = 0;
    document.addEventListener('keydown', () => (start = performance.now()), true);
    document.addEventListener(
      'input',
      () =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => times.push(performance.now() - start)),
        ),
      true,
    );
  });
  await input.fill('');
  await input.focus();
  for (const ch of 'portfolio keystrokes') await page.keyboard.type(ch);
  await page.waitForTimeout(200);

  const times = await page.evaluate(() => (window as unknown as { __latency: number[] }).__latency);
  expect(times.length).toBeGreaterThanOrEqual(15);
  const sorted = [...times].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95) - 1] ?? 0;
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  console.warn(
    `input latency over ${times.length} keys: median ${median.toFixed(1)}ms, p95 ${p95.toFixed(1)}ms`,
  );
  expect(p95).toBeLessThan(50);
});

test('typing the prompt moves nothing on a phone-sized page', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 412, height: 823 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const route of ['/projects/zenith/', '/journey/', '/skills/python/', '/about/']) {
    await page.goto(`${baseURL}${route}`);
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, route).toBeLessThan(0.01);
  }
  await context.close();
});
