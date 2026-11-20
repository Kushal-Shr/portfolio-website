import { expect, test } from '@playwright/test';
import { builtRoutes, expectNoA11yViolations } from './utils';

// axe on every page in the site, in every project (desktop, reduced motion, Pixel 7, iPhone 13 in
// WebKit, 320px, tablet, 1024 and 1920).
test('every page passes axe (WCAG 2.2 AA)', async ({ page, request }) => {
  test.setTimeout(300_000);
  for (const href of await builtRoutes(request)) {
    await page.goto(href);
    await expect(page.locator('h1'), href).toHaveCount(1);
    await expectNoA11yViolations(page);
  }
});

test.describe('target size', () => {
  const ROUTES = [
    '/',
    '/dashboard/',
    '/projects/',
    '/experience/',
    '/leadership/',
    '/skills/',
    '/guide/',
    '/journey/',
    '/resume/',
    '/projects/zenith/',
    '/skills/python/',
  ];

  test('every button and nav link is at least 44×44px', async ({ page }) => {
    const small: string[] = [];
    for (const href of ROUTES) {
      await page.goto(href);
      const found = await page.evaluate(() => {
        // A mouse on a wide screen may use the dashboard's dense rows (24px, the WCAG AA floor);
        // anything touch or narrow must be 44px.
        const dense = matchMedia('(pointer: fine)').matches && innerWidth >= 1024;
        const hits: string[] = [];
        for (const el of document.querySelectorAll('button, nav a, summary, input')) {
          const box = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (box.width === 0 || style.visibility === 'hidden' || el.closest('.sr-only')) continue;
          if (el.matches('.skip-link')) continue;
          const min = dense && el.hasAttribute('data-dense') ? 24 : 44;
          if (box.width < min - 0.5 || box.height < min - 0.5) {
            hits.push(
              `${el.tagName.toLowerCase()} "${(el.textContent || el.id).trim().slice(0, 24)}" ${Math.round(box.width)}×${Math.round(box.height)}`,
            );
          }
        }
        return hits;
      });
      small.push(...found.map((f) => `${href}: ${f}`));
    }
    expect(small).toEqual([]);
  });
});

test.describe('keyboard', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard-driven, desktop only');
  });

  for (const route of ['/', '/dashboard/', '/skills/', '/guide/']) {
    test(`${route}: the skip link is first, and every Tab stop has a visible focus ring`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'skip to content' })).toBeFocused();

      const invisible: string[] = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        const ring = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const s = getComputedStyle(el);
          return {
            name: `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || el.id).trim().slice(0, 24)}"`,
            style: s.outlineStyle,
            width: parseFloat(s.outlineWidth),
          };
        });
        if (!ring) break;
        // The shell's text inputs draw their own block cursor in place of a ring.
        if (ring.name.startsWith('input "') && /cmd/.test(ring.name)) continue;
        if (ring.style === 'none' || ring.width < 1) invisible.push(ring.name);
      }
      expect(invisible).toEqual([]);
    });
  }

  test('the focus ring on the green nav bar is not green', async ({ page }) => {
    await page.goto('/about/');
    await page.getByRole('link', { name: '3:projects' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const color = await page
      .getByRole('link', { name: '3:projects' })
      .evaluate((el) => getComputedStyle(el).outlineColor);
    expect(color).toBe('rgb(12, 15, 13)'); // --bg: dark, so it shows on the green bar
  });

  test('nothing is hidden behind the sticky dock when tabbing to the end of a long page', async ({
    page,
  }) => {
    await page.goto('/guide/');
    const hidden: string[] = [];
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('Tab');
      const covered = await page.evaluate(() => {
        const el = document.activeElement;
        const group = document.querySelector('.dock-group');
        if (!el || el === document.body || !group || el.closest('.dock-group')) return false;
        return el.getBoundingClientRect().bottom > group.getBoundingClientRect().top + 1;
      });
      if (covered)
        hidden.push(
          await page.evaluate(() => document.activeElement?.textContent?.slice(0, 30) ?? ''),
        );
    }
    expect(hidden).toEqual([]);
  });
});

test.describe('forced colors', () => {
  test('the nav keeps a border and its current tab stays distinguishable', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'one run is enough');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/about/');
    const nav = page.getByRole('navigation', { name: 'Pages' });
    await expect(nav).toBeVisible();
    expect(await nav.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px');
    const current = nav.locator('[aria-current="page"]');
    const outline = await current.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).toBe('solid');
    expect(outline.width).toBeGreaterThanOrEqual(2);
    // The blinking cursor is a text glyph, so it keeps showing.
    await expect(page.locator('main .cursor-blink').first()).toBeVisible();
    // Box borders survive too.
    await page.goto('/projects/');
    const border = await page
      .locator('main article')
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopStyle);
    expect(border).toBe('solid');
  });
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== 'desktop-reduced-motion', 'reduced-motion project only');
  });

  for (const route of [
    '/',
    '/dashboard/',
    '/skills/',
    '/journey/',
    '/guide/',
    '/projects/zenith/',
  ]) {
    test(`${route}: nothing animates and nothing scrolls smoothly`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map(
            (a) =>
              a.id ||
              (a.effect as KeyframeEffect | null)?.target?.className?.toString() ||
              'animation',
          ),
      );
      expect(running).toEqual([]);
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
      ).not.toBe('smooth');
    });
  }
});

test.describe('structure for screen readers', () => {
  // The parts VoiceOver's rotor is built from. (The listening itself needs a person and a Mac.)
  for (const route of ['/', '/projects/', '/experience/', '/leadership/president/', '/journey/']) {
    test(`${route}: one main, one nav named Pages, a heading outline`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Pages', exact: true })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      // Next's own announcer: exactly one live region says the new page title, not two.
      await expect(page.locator('next-route-announcer')).toHaveCount(1);
    });
  }

  test('detail pages add a labelled trail nav', async ({ page }) => {
    await page.goto('/projects/zenith/');
    await expect(page.getByRole('navigation', { name: 'Projects pages' })).toHaveCount(1);
  });

  test('the leadership roles read as a table with column headers', async ({ page }) => {
    await page.goto('/leadership/');
    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader')).toHaveText([
      'PID',
      'ROLE',
      'ORG',
      'SCOPE',
      'STAT',
      'STATUS',
    ]);
  });

  test('ASCII art is skipped, and its picture has a name', async ({ page }) => {
    await page.goto('/projects/zenith/');
    expect(await page.locator('pre[aria-hidden="true"]').count()).toBeGreaterThan(0);
    // Each picture is a role="img" with a sentence describing it.
    const names = await page
      .locator('[role="img"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.length).toBeGreaterThan(20);
  });

  test('the resume’s rule rows are hidden from assistive tech', async ({ page }) => {
    await page.goto('/resume/');
    const spoken = await page.locator('pre.resume-text').evaluate((pre) => {
      const visible = (n: Node): string =>
        n.nodeType === 3
          ? (n.textContent ?? '')
          : n instanceof Element && n.getAttribute('aria-hidden') === 'true'
            ? ''
            : [...n.childNodes].map(visible).join('');
      return visible(pre);
    });
    expect(spoken).not.toMatch(/={10,}|-{10,}/);
  });
});

test.describe('dock focus rules', () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name !== 'desktop', 'keyboard-driven, desktop only');
  });

  test('clicking the nav bar does not move focus into the dock', async ({ page }) => {
    await page.goto('/about/');
    await page
      .getByRole('navigation', { name: 'Pages', exact: true })
      .getByRole('link', { name: /projects/ })
      .click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator('#dock-cmd')).not.toBeFocused();
  });
});
