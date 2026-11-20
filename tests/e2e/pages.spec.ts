import { expect, test } from '@playwright/test';
import { achievements, experience, leadership, profile, projects } from '../../content';
import { collectConsoleErrors, expectNoA11yViolations } from './utils';

const pages: { path: string; strings: string[] }[] = [
  { path: '/about/', strings: [profile.oneLiner, 'EXIT STATUS', 'SEE ALSO'] },
  { path: '/projects/', strings: projects.map((p) => `${p.slug}/`) },
  {
    path: '/experience/',
    strings: [`commit ${experience[0]?.commit}`, 'Frontend Software Engineering Intern'],
  },
  { path: '/leadership/', strings: [leadership[0]?.role ?? '', 'ls ~/achievements'] },
  { path: '/resume/', strings: ['wget resume.pdf', 'COMPETITIONS', 'three competition wins'] },
  { path: '/dashboard/', strings: ['README.md', 'git log --oneline', profile.email] },
];

for (const { path, strings } of pages) {
  test(`${path} renders cleanly with its key content`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const text of strings) await expect(page.locator('body')).toContainText(text);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });
}

test('projects: Rant & Heal links to source only, Sanctuary shows its placeholder', async ({
  page,
}) => {
  await page.goto('/projects/');
  const rant = page.locator('#rant-and-heal');
  await expect(rant.getByRole('link', { name: '[source]' })).toBeVisible();
  await expect(rant.getByRole('link', { name: '[devpost]' })).toHaveCount(0);
  await expect(page.locator('#sanctuary')).toContainText('[add: the parts of Sanctuary you built');
  await expect(page.locator('main')).toContainText(`${projects.length} projects`);
});

test('/projects/#airdesk scrolls the airdesk card into view', async ({ page }) => {
  await page.goto('/projects/#airdesk');
  await expect(page.locator('#airdesk')).toBeInViewport();
});

test('leadership lists every achievement', async ({ page }) => {
  await page.goto('/leadership/');
  for (const a of achievements) await expect(page.locator('main')).toContainText(a.event);
});

test('resume: /resume.pdf is served as a PDF', async ({ request }) => {
  const response = await request.get('/resume.pdf');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('resume prints to exactly one Letter page', async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one print run is enough');
  expect(browserName).toBe('chromium');
  await page.goto('/resume/');
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'Letter' });
  const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;
  expect(pageCount).toBe(1);
});

test.describe('dashboard', () => {
  test('ArrowDown moves the selection and the README title changes', async ({ page }) => {
    await page.goto('/dashboard/');
    const first = page.getByRole('button', { name: /rant-and-heal\// });
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('button', { name: /zenith\// })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: /zenith\// })).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('zenith');
    await expect(page).toHaveURL(/#zenith$/);
    await page.keyboard.press('End');
    await expect(page.getByRole('button', { name: /sanctuary\// })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('loading /dashboard/#zenith selects zenith', async ({ page }) => {
    await page.goto('/dashboard/#zenith');
    await expect(page.getByRole('button', { name: /zenith\// })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('main')).toContainText('README.md — zenith');
  });

  test('reduced motion shows the full portrait and title immediately', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-reduced-motion', 'reduced-motion project only');
    await page.goto('/dashboard/');
    await expect(page.getByText('✓ done')).toBeVisible();
    await expect(page.locator('h1 > span[aria-hidden="true"]')).toContainText('rant-and-heal');
  });

  test('the portrait finishes revealing', async ({ page }, info) => {
    test.skip(info.project.name === 'desktop-reduced-motion', 'animation only');
    await page.goto('/dashboard/');
    await expect(page.getByText('✓ done')).toBeVisible({ timeout: 4000 });
  });
});
