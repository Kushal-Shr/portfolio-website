import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:4173';
// A second build of the site with the fake fixture entries (`tests/fixtures/journey`), so the
// populated journey is tested as well as the real, possibly empty, one.
const JOURNEY_FIXTURES_URL = 'http://localhost:4174';
const FIXTURE_SPECS = /journey-fixtures\.spec\.ts/;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
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
    {
      name: 'desktop',
      testIgnore: FIXTURE_SPECS,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', testIgnore: FIXTURE_SPECS, use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop-reduced-motion',
      testIgnore: FIXTURE_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        reducedMotion: 'reduce',
      },
    },
    {
      name: 'journey-fixtures',
      testMatch: FIXTURE_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        baseURL: JOURNEY_FIXTURES_URL,
        timezoneId: 'America/Chicago',
      },
    },
    {
      name: 'journey-fixtures-mobile',
      testMatch: FIXTURE_SPECS,
      use: { ...devices['Pixel 7'], baseURL: JOURNEY_FIXTURES_URL, timezoneId: 'America/Chicago' },
    },
  ],
});
