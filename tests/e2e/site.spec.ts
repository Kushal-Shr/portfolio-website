import { expect, test, type Page } from '@playwright/test';
import { flatten } from '../../lib/site-tree';
import { siteTree } from '../../lib/site-data';
import { builtRoutes, collectConsoleErrors, crawl, expectNoA11yViolations } from './utils';

const dockInput = (page: Page) => page.locator('#dock-cmd');
const panel = (page: Page) => page.locator('.dock [role="log"]');

/** The nav clock only gets its `datetime` after React has mounted, so the key handlers exist. */
const hydrated = (page: Page) => page.locator('nav time[datetime]').waitFor({ state: 'attached' });

async function dock(page: Page, command: string) {
  await hydrated(page);
  await page.keyboard.press(':');
  await expect(dockInput(page)).toBeFocused();
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
}

test.describe('site crawl', () => {
  test('every page in the tree returns 200 with exactly one <h1>', async ({
    page,
    request,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'one crawl is enough');
    test.setTimeout(120_000);
    // The built fs.json is the tree as this build saw it, so real journey entries are crawled too.
    const hrefs = await builtRoutes(request);
    const tree = flatten(siteTree).flatMap((n) => (n.href ? [n.href] : []));
    expect(hrefs).toEqual(expect.arrayContaining(tree));
    expect(hrefs.length).toBeGreaterThan(50);
    await crawl(page, hrefs);
  });
});

test.describe('the dock', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard-driven, desktop only');
    await page.goto('/projects/');
    await expect(page.locator('.dock')).toBeVisible();
  });

  test('is on every page except the home shell', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('.dock')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('.dock')).toHaveCount(0);
  });

  test('never grabs focus on page load', async ({ page }) => {
    await expect(dockInput(page)).not.toBeFocused();
  });

  test('cd navigates, keeps focus in the dock, and the prompt follows the URL', async ({
    page,
  }) => {
    await expect(page.locator('.dock label')).toContainText('~/projects');
    await dock(page, 'cd zenith');
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
    await expect(page.locator('.dock label')).toContainText('~/projects/zenith');
    await expect(dockInput(page)).toBeFocused();

    await page.keyboard.type('cd ..');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(dockInput(page)).toBeFocused();

    await page.keyboard.type('cd -');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
  });

  test('open resume goes to the resume page', async ({ page }) => {
    await dock(page, 'open resume');
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('browser Back makes the dock cwd follow the URL', async ({ page }) => {
    await dock(page, 'cd zenith');
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator('.dock label')).toContainText('~/projects');
    await expect(page.locator('.dock label')).not.toContainText('~/projects/zenith');
  });

  test('prints output in a panel; Esc closes it, a second Esc blurs the input', async ({
    page,
  }) => {
    await dock(page, 'ls');
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText('rant-and-heal/');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(dockInput(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dockInput(page)).not.toBeFocused();
  });

  test('shares one session with the home shell', async ({ page }) => {
    await page.goto('/about/');
    await dock(page, 'echo from-the-dock');
    await expect(panel(page)).toContainText('from-the-dock');
    await page
      .getByRole('navigation', { name: 'Pages', exact: true })
      .getByRole('link', { name: /shell/ })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('log')).toContainText('echo from-the-dock');
    await expect(page.getByRole('log')).toContainText('from-the-dock');
  });

  test('history survives a reload (ArrowUp recalls)', async ({ page }) => {
    await dock(page, 'echo remembered');
    await expect(panel(page)).toContainText('remembered');
    await page.reload();
    await hydrated(page);
    await page.keyboard.press(':');
    await page.keyboard.press('ArrowUp');
    await expect(dockInput(page)).toHaveValue('echo remembered');
  });

  test('Tab completes paths', async ({ page }) => {
    await page.keyboard.press(':');
    await page.keyboard.type('cd zen');
    await page.keyboard.press('Tab');
    await expect(dockInput(page)).toHaveValue('cd zenith/');
  });

  test('Tab with an empty line moves focus on', async ({ page }) => {
    await page.keyboard.press(':');
    await expect(dockInput(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dockInput(page)).not.toBeFocused();
  });

  test('typing : or / in another input does not steal focus', async ({ page }) => {
    await page.goto('/');
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    const home = page.locator('#cmd');
    await expect(home).toBeEnabled();
    await home.focus();
    await page.keyboard.type('a:b/c');
    await expect(home).toHaveValue('a:b/c');
  });

  test('neofetch sends you to the home shell', async ({ page }) => {
    await dock(page, 'neofetch');
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('img', { name: 'ASCII portrait of Kushal Shrestha' }).last(),
    ).toBeVisible();
  });

  test('is clean with the panel open and closed', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await expectNoA11yViolations(page);
    await dock(page, 'tree');
    await expect(panel(page)).toBeVisible();
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });

  test('prints a clear error when fs.json fails, and the nav still works', async ({ page }) => {
    await page.route('**/fs.json*', (route) => route.abort());
    await page.goto('/projects/');
    await dock(page, 'ls');
    await expect(panel(page)).toContainText(
      "portfolio-sh: couldn't load the filesystem — the nav bar below still works",
    );
    await page
      .getByRole('navigation', { name: 'Pages', exact: true })
      .getByRole('link', { name: /about/ })
      .click();
    await expect(page).toHaveURL(/\/about\/$/);
  });

  test('the sticky bar never covers a focused link', async ({ page }) => {
    await page.goto('/projects/zenith/');
    const last = page.getByRole('navigation', { name: 'projects pages' }).getByRole('link').last();
    await last.focus();
    const link = await last.boundingBox();
    const group = await page.locator('.dock-group').boundingBox();
    expect(link && group && link.y + link.height <= group.y + 1).toBe(true);
  });
});

test.describe('the home shell navigates', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
  });

  test('cd projects goes to the projects page', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cmd').fill('cd projects');
    await page.locator('#cmd').press('Enter');
    await expect(page).toHaveURL(/\/projects\/$/);
  });

  test('/?run=cd projects lands on /projects/, and Back does not loop', async ({ page }) => {
    await page.goto('/about/');
    await page.goto('/?run=cd%20projects');
    await expect(page).toHaveURL(/\/projects\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/about\/$/);
  });

  test('open zenith from anywhere opens its page', async ({ page }) => {
    await page.goto('/');
    await page.locator('#cmd').fill('open zenith');
    await page.locator('#cmd').press('Enter');
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
  });
});

test.describe('section pages link to their detail pages', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name === 'mobile', 'desktop layout');
  });

  test('projects: the box title and [readme]', async ({ page }) => {
    await page.goto('/projects/');
    await page.locator('#zenith').getByRole('link', { name: 'zenith/' }).click();
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
    await page.goto('/projects/');
    await page.locator('#airdesk').getByRole('link', { name: '[readme]' }).click();
    await expect(page).toHaveURL(/\/projects\/airdesk\/$/);
  });

  test('experience: the title and the commit hash', async ({ page }) => {
    await page.goto('/experience/');
    await page.getByRole('link', { name: /commit 7c41e9a/ }).click();
    await expect(page).toHaveURL(/\/experience\/schnuck\/$/);
  });

  test('leadership: role, achievement and the achievements heading', async ({ page }) => {
    await page.goto('/leadership/');
    await page.getByRole('link', { name: 'President' }).click();
    await expect(page).toHaveURL(/\/leadership\/president\/$/);
    await page.goto('/leadership/');
    await page.getByRole('link', { name: 'Webster Hackfest 2025' }).click();
    await expect(page).toHaveURL(/\/leadership\/achievements\/hackfest-2025\/$/);
    await page.goto('/leadership/');
    await page.getByRole('link', { name: 'ls ~/achievements' }).click();
    await expect(page).toHaveURL(/\/leadership\/achievements\/$/);
  });

  test('skills: a package name', async ({ page }) => {
    await page.goto('/skills/');
    await page.getByRole('link', { name: 'Python', exact: true }).click();
    await expect(page).toHaveURL(/\/skills\/python\/$/);
  });

  test('about: a project and a job', async ({ page }) => {
    await page.goto('/about/');
    await page.getByRole('link', { name: 'zenith', exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
  });

  test('dashboard: Enter on the selected project opens its page, and the cd link works', async ({
    page,
  }) => {
    await page.goto('/dashboard/');
    const zenith = page.getByRole('button', { name: /zenith\// });
    await zenith.click();
    await expect(page.getByRole('link', { name: 'cd zenith →' })).toBeVisible();
    await zenith.press('Enter');
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
  });
});

test.describe('detail pages', () => {
  const samples = [
    '/projects/zenith/',
    '/experience/schnuck/',
    '/leadership/president/',
    '/leadership/achievements/',
    '/leadership/achievements/hackfest-2025/',
    '/skills/python/',
  ];

  for (const path of samples) {
    test(`${path} is accessible and clean`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(path);
      await expect(page.getByRole('navigation', { name: /pages$/i })).toHaveCount(2);
      await expectNoA11yViolations(page);
      expect(errors).toEqual([]);
    });
  }

  test('a trail links the parent, previous and next pages', async ({ page }) => {
    await page.goto('/projects/zenith/');
    const trail = page.getByRole('navigation', { name: 'projects pages' });
    await expect(trail.getByRole('link', { name: 'cd ..' })).toHaveAttribute('href', '/projects/');
    await expect(trail.locator('[rel="prev"]')).toHaveAttribute('href', '/projects/rant-and-heal/');
    await expect(trail.locator('[rel="next"]')).toHaveAttribute('href', '/projects/surgipath/');
  });

  test('a skill page lists the projects and jobs that use it', async ({ page }) => {
    await page.goto('/skills/python/');
    await expect(page.getByRole('link', { name: 'surgipath' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'schnuck' })).toBeVisible();
  });

  test('Rant & Heal shows source only, and its win links back', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'the phone layout arrives in phase 8');
    await page.goto('/projects/rant-and-heal/');
    await expect(page.getByRole('link', { name: '[source]' })).toBeVisible();
    await expect(page.getByRole('link', { name: '[devpost]' })).toHaveCount(0);
    await page.getByRole('link', { name: /Webster Hackfest 2025: Best Overall Project/ }).click();
    await expect(page).toHaveURL(/\/leadership\/achievements\/hackfest-2025\/$/);
    await expect(page.getByRole('link', { name: '[devpost]' })).toBeVisible();
  });

  test('write-up open questions never render', async ({ page }) => {
    await page.goto('/projects/zenith/');
    await expect(page.locator('body')).not.toContainText('TODO(kushal)');
    await expect(page.getByRole('heading', { name: 'the problem' })).toBeVisible();
  });

  test('empty write-up sections are dropped with their headings', async ({ page }) => {
    await page.goto('/leadership/president/');
    await expect(page.getByRole('heading', { name: 'the role' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'what I did' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'what changed' })).toHaveCount(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the dock is hidden and a detail page shows its full content', async ({ page }) => {
    await page.goto('/projects/zenith/');
    await expect(page.locator('.dock')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Zenith');
    await expect(page.locator('main')).toContainText('what I built');
    await expect(page.getByRole('navigation', { name: 'Pages', exact: true })).toBeVisible();
  });
});
