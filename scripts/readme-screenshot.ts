/* eslint-disable no-console -- a CLI script: its output is the console */
// `pnpm screenshot`: writes docs/screenshot.png, the home shell after `neofetch` at 1280×800, for
// the README. Needs the built site to be served: `pnpm build && pnpm serve` in another terminal.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const URL = process.env.SCREENSHOT_URL ?? 'http://localhost:4173/';
const OUT = join(process.cwd(), 'docs', 'screenshot.png');

async function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  const browser = await chromium.launch();
  // Reduced motion: the page is in its final state (typed text, drawn portrait), no waiting.
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 2,
  });
  try {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto(URL);
    const input = page.locator('#cmd');
    await input.waitFor({ state: 'visible' });
    await page.waitForFunction(
      () => !(document.querySelector('#cmd') as HTMLInputElement).disabled,
    );
    await input.fill('neofetch');
    await input.press('Enter');
    await page.getByRole('log').getByText('Name').first().waitFor();
    await page.screenshot({ path: OUT });
    console.log(`wrote ${OUT}`);
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    `screenshot failed: ${error instanceof Error ? error.message : String(error)}\n` +
      `Is the site being served at ${URL}? (pnpm build && pnpm serve)`,
  );
  process.exit(1);
});
