import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:4173';
// A second build of the site with the fake fixture entries (`tests/fixtures/journey`), so the
// populated journey is tested as well as the real, possibly empty one.
const JOURNEY_FIXTURES_URL = 'http://localhost:4174';

const FIXTURE_SPECS = /journey-fixtures\.spec\.ts/;
const VISUAL_SPEC = /visual\.spec\.ts/;
const VISUAL_FIXTURE_SPEC = /visual-fixtures\.spec\.ts/;
// Specs that also run on the extra device projects (WebKit, 320px, tablet, 1024, 1920).
const RESPONSIVE_SPECS = [/responsive\.spec\.ts/, /a11y\.spec\.ts/, /mobile\.spec\.ts/];
const NOT_REGULAR = [FIXTURE_SPECS, VISUAL_SPEC, VISUAL_FIXTURE_SPEC];

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } };
const phone = (width: number, height: number) => ({
  ...devices['Pixel 7'],
  viewport: { width, height },
});

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // One baseline per screenshot, whatever the OS or project: the `visual` projects are the only
  // ones that take them. Regenerate on purpose with `--update-snapshots`.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0, threshold: 0 },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Started in order: the fixture build moves its `out/` aside before the real build runs.
  webServer: [
    {
      command: 'pnpm build:journey-fixtures && pnpm exec serve out-journey -l 4174 --no-clipboard',
      url: JOURNEY_FIXTURES_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: 'pnpm build && pnpm exec serve out -l 4173 --no-clipboard',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
  projects: [
    { name: 'desktop', testIgnore: NOT_REGULAR, use: desktop },
    { name: 'mobile', testIgnore: NOT_REGULAR, use: devices['Pixel 7'] },
    {
      name: 'desktop-reduced-motion',
      testIgnore: NOT_REGULAR,
      use: { ...desktop, reducedMotion: 'reduce' },
    },
    // The whole regular suite in desktop Safari's engine, opt-in (`PW_WEBKIT=1`). It passes on its
    // own (97 tests), but beside the other projects a navigation sometimes stalls for 30s+ in
    // WebKit, so it is not part of the default run.
    ...(process.env.PW_WEBKIT
      ? [
          {
            name: 'desktop-webkit',
            retries: 2,
            testIgnore: NOT_REGULAR,
            use: { ...devices['Desktop Safari'], viewport: desktop.viewport },
          },
        ]
      : []),
    // iOS Safari's engine, on an iPhone 13 (390px): the only WebKit coverage there is.
    {
      name: 'mobile-webkit',
      // Playwright's WebKit sometimes never fires `load` on a page when the whole suite is running
      // at once (it passes in 30s alone). A retry is reported as "flaky", so it stays visible.
      retries: 2,
      testMatch: RESPONSIVE_SPECS,
      use: devices['iPhone 13'],
    },
    // The narrowest screen WCAG 1.4.10 cares about (a 1280px window at 400% zoom).
    { name: 'narrow-320', testMatch: RESPONSIVE_SPECS, use: phone(320, 640) },
    {
      name: 'tablet-768',
      testMatch: RESPONSIVE_SPECS,
      use: { ...devices['iPad Mini'], defaultBrowserType: 'chromium' },
    },
    {
      name: 'desktop-1024',
      testMatch: RESPONSIVE_SPECS,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'wide-1920',
      testMatch: RESPONSIVE_SPECS,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'journey-fixtures',
      testMatch: FIXTURE_SPECS,
      use: { ...desktop, baseURL: JOURNEY_FIXTURES_URL, timezoneId: 'America/Chicago' },
    },
    {
      name: 'journey-fixtures-mobile',
      testMatch: FIXTURE_SPECS,
      use: { ...devices['Pixel 7'], baseURL: JOURNEY_FIXTURES_URL, timezoneId: 'America/Chicago' },
    },
    // Visual baselines: reduced motion so every page is in its final state.
    {
      name: 'visual',
      testMatch: VISUAL_SPEC,
      use: { ...desktop, reducedMotion: 'reduce', timezoneId: 'America/Chicago' },
    },
    {
      name: 'visual-fixtures',
      testMatch: VISUAL_FIXTURE_SPEC,
      use: {
        ...desktop,
        reducedMotion: 'reduce',
        baseURL: JOURNEY_FIXTURES_URL,
        timezoneId: 'America/Chicago',
      },
    },
  ],
});
