import { expect, test, type Page } from '@playwright/test';
import { collectConsoleErrors, expectNoA11yViolations } from './utils';

const portrait = (page: Page) =>
  page.getByRole('img', { name: 'ASCII portrait of Kushal Shrestha' });
const log = (page: Page) => page.getByRole('log');
const input = (page: Page) => page.locator('#cmd');

async function run(page: Page, command: string) {
  await input(page).fill(command);
  await input(page).press('Enter');
}

/** Skips the boot animation so a scenario starts from the settled shell. */
async function settled(page: Page) {
  await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
  await page.goto('/');
  await expect(input(page)).toBeEnabled();
}

test.describe('boot', () => {
  test('completes and shows the neofetch card', async ({ page }, info) => {
    await page.goto('/');
    if (info.project.name === 'desktop-reduced-motion') {
      await expect(portrait(page)).toBeVisible({ timeout: 1000 });
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Kushal Shrestha');
    } else {
      await expect(portrait(page)).toBeVisible({ timeout: 9000 });
    }
    await expect(page.locator('main')).toContainText('Name: Kushal Shrestha');
    await expect(page.locator('#shell-hint')).toBeVisible();
  });

  test('typing during the boot skips it immediately', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'boot animation only');
    await page.goto('/');
    await expect(input(page)).toBeVisible({ timeout: 6000 });
    await page.keyboard.press('x');
    await expect(page.locator('#shell-hint')).toBeVisible({ timeout: 500 });
    await expect(input(page)).toHaveValue(/^x$/);
    await page.waitForTimeout(2500);
    await expect(portrait(page)).toHaveCount(0);
  });

  test('clicking a chip during the boot skips it and runs the command', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'boot animation only');
    await page.goto('/');
    await page.getByRole('button', { name: 'ls', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('in St. Louis.');
    await expect(log(page)).toContainText('projects/');
  });

  test('only animates once per session', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'boot animation only');
    await page.goto('/');
    await expect(portrait(page)).toBeVisible({ timeout: 9000 });
    await page.reload();
    await expect(portrait(page)).toBeVisible({ timeout: 1500 });
  });
});

test.describe('commands', () => {
  test.beforeEach(async ({ page }) => settled(page));

  test('ls shows projects/ styled as a directory', async ({ page }) => {
    await run(page, 'ls');
    const dir = log(page).getByText('projects/', { exact: true }).last();
    await expect(dir).toBeVisible();
    await expect(dir).toHaveClass(/text-blue/);
    await expect(dir).toHaveClass(/font-bold/);
  });

  test("cd navigates to the folder's page and the shell follows the URL", async ({ page }) => {
    await run(page, 'cd projects');
    await expect(page).toHaveURL(/\/projects\/$/);
    if ((page.viewportSize()?.width ?? 1280) < 640) {
      // Phones fold the dock behind the nav bar's `>_` button until it is opened.
      await expect(page.locator('.dock')).toBeHidden();
      await page.getByRole('button', { name: 'command line' }).tap();
    }
    await expect(page.getByLabel('command line', { exact: false })).toBeVisible();
    if ((page.viewportSize()?.width ?? 1280) < 640) {
      // A phone draws a shortened cwd from `data-short` (`…/zenith`; a short one stays whole).
      await expect(page.locator('.dock [data-short]')).toHaveAttribute('data-short', '~/projects');
    } else {
      await expect(page.locator('.dock').getByText('~/projects')).toBeVisible();
    }
  });

  test('cat shows the file and links to the project card', async ({ page }) => {
    await run(page, 'cat projects/zenith/README.md');
    await expect(log(page)).toContainText('# zenith (Ghost Visualizer)');
    await expect(
      log(page).getByRole('link', { name: 'open ~/projects/zenith as a page' }),
    ).toHaveAttribute('href', '/projects/zenith/');
  });

  test('sudo hire-me shows a mailto link and never a phone number', async ({ page }) => {
    await run(page, 'sudo hire-me');
    await expect(log(page).locator('a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/\d{3}[-. ]\d{3}[-. ]\d{4}/);
  });

  test('unknown commands and typos', async ({ page }) => {
    await run(page, 'foo');
    await expect(log(page)).toContainText('portfolio-sh: command not found: foo — try help');
    await run(page, 'sl');
    await expect(log(page)).toContainText('did you mean: ls?');
  });

  test('contact lists email, GitHub and LinkedIn', async ({ page }) => {
    await run(page, 'contact');
    await expect(log(page).getByRole('link', { name: /github\.com\/Kushal-Shr/ })).toBeVisible();
    await expect(log(page).getByRole('link', { name: /linkedin\.com/ })).toBeVisible();
  });
});

test.describe('keyboard', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'hardware keyboard behaviour');
    await settled(page);
  });

  test('Tab completes a directory', async ({ page }) => {
    await input(page).fill('cd pro');
    await input(page).press('Tab');
    await expect(input(page)).toHaveValue('cd projects/');
    await expect(input(page)).toBeFocused();
  });

  test('a second Tab lists the candidates without adding history', async ({ page }) => {
    await input(page).fill('c');
    await input(page).press('Tab');
    await input(page).press('Tab');
    await expect(log(page)).toContainText('cat');
    await expect(log(page)).toContainText('contact');
    await run(page, 'history');
    await expect(log(page)).not.toContainText('    2  c');
  });

  test('Tab with an empty input moves focus out of the input', async ({ page }) => {
    await input(page).focus();
    await expect(input(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(input(page)).not.toBeFocused();
    await expect(page.getByRole('button', { name: 'neofetch' })).toBeFocused();
  });

  test('ArrowUp recalls and ArrowDown returns to empty', async ({ page }) => {
    await run(page, 'pwd');
    await input(page).press('ArrowUp');
    await expect(input(page)).toHaveValue('pwd');
    await input(page).press('ArrowDown');
    await expect(input(page)).toHaveValue('');
  });

  test('Ctrl+L clears the screen', async ({ page }) => {
    await run(page, 'pwd');
    await expect(log(page)).toContainText('/home/guest');
    await input(page).press('Control+l');
    await expect(log(page)).not.toContainText('/home/guest');
  });

  test('Ctrl+C echoes ^C and Ctrl+U / Escape clear the draft', async ({ page }) => {
    await input(page).fill('half a comm');
    await input(page).press('Control+c');
    await expect(log(page)).toContainText('half a comm^C');
    await expect(input(page)).toHaveValue('');
    await input(page).fill('abc');
    await input(page).press('Control+u');
    await expect(input(page)).toHaveValue('');
    await input(page).fill('abc');
    await input(page).press('Escape');
    await expect(input(page)).toHaveValue('');
  });
});

test.describe('chips and persistence', () => {
  test.beforeEach(async ({ page }) => settled(page));

  test('clicking a chip runs it and returns focus to the input', async ({ page }) => {
    await page.getByRole('button', { name: 'tree', exact: true }).click();
    await expect(log(page)).toContainText(/\d+ directories, \d+ files/);
    await expect(input(page)).toBeFocused();
  });

  test('the session survives navigating away and back', async ({ page, isMobile }) => {
    await run(page, 'echo still-here');
    if (isMobile) {
      // The nav is off-screen on /about/ until phase 7 fixes its phone layout.
      await page.goto('/about/');
      await page.goto('/');
    } else {
      const nav = page.getByRole('navigation', { name: 'Pages' });
      await nav.getByRole('link', { name: /about/ }).click();
      await expect(page).toHaveURL(/\/about\/$/);
      await nav.getByRole('link', { name: /shell/ }).click();
    }
    await expect(page.getByText('guest@portfolio: ~', { exact: true })).toBeVisible();
    await expect(log(page)).toContainText('still-here');
  });
});

test.describe('?run= deep links', () => {
  test('/?run=tree runs tree and strips the parameter', async ({ page }) => {
    await page.goto('/?run=tree');
    await expect(log(page)).toContainText(/\d+ directories, \d+ files/);
    expect(page.url()).not.toContain('run=');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('/?run=sudo%20hire-me works', async ({ page }) => {
    await page.goto('/?run=sudo%20hire-me');
    await expect(log(page).locator('a[href^="mailto:"]')).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the intro and neofetch info', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kushal Shrestha');
    await expect(page.locator('main')).toContainText('Name: Kushal Shrestha');
    await expect(page.locator('main')).toContainText('Role: CS student · data & AI');
    await expect(page.getByRole('navigation', { name: 'Pages' })).toBeVisible();
  });
});

test('home is clean after running several commands', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await settled(page);
  for (const cmd of ['help', 'ls', 'cat projects/sanctuary', 'tree', 'contact', 'oops']) {
    await run(page, cmd);
  }
  await expectNoA11yViolations(page);
  expect(errors).toEqual([]);
});
