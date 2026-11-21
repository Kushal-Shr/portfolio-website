import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { projects } from '../../content/projects';
import { profile } from '../../content/profile';
import { builtRoutes, collectConsoleErrors, expectNoA11yViolations } from './utils';

// These check files and markup, so one project is enough.
test.beforeEach(async ({}, info) => {
  test.skip(!['desktop', 'desktop-reduced-motion'].includes(info.project.name), 'one project');
});

const pick = (html: string, re: RegExp): string | undefined => {
  const raw = re.exec(html)?.[1];
  return raw?.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'");
};

type Head = {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogTitle?: string;
  ogUrl?: string;
  twitterImage?: string;
  twitterCard?: string;
};

const readHead = (html: string): Head => ({
  title: pick(html, /<title>([^<]*)<\/title>/),
  description: pick(html, /<meta name="description" content="([^"]*)"/),
  canonical: pick(html, /<link rel="canonical" href="([^"]*)"/),
  ogImage: pick(html, /<meta property="og:image" content="([^"]*)"/),
  ogTitle: pick(html, /<meta property="og:title" content="([^"]*)"/),
  ogUrl: pick(html, /<meta property="og:url" content="([^"]*)"/),
  twitterImage: pick(html, /<meta name="twitter:image" content="([^"]*)"/),
  twitterCard: pick(html, /<meta name="twitter:card" content="([^"]*)"/),
});

const pathOf = (url: string): string => new URL(url).pathname;

async function expectPng(request: APIRequestContext, url: string): Promise<void> {
  const res = await request.get(pathOf(url));
  expect(res.status(), url).toBe(200);
  expect(res.headers()['content-type'], url).toBe('image/png');
  const body = await res.body();
  // PNG signature, then the IHDR width and height: 1200×630.
  expect(body.subarray(1, 4).toString(), url).toBe('PNG');
  expect(body.readUInt32BE(16), url).toBe(1200);
  expect(body.readUInt32BE(20), url).toBe(630);
}

test.describe('metadata on every page', () => {
  test('has a unique title, a description, a canonical and a PNG og:image', async ({ request }) => {
    test.setTimeout(120_000);
    const routes = await builtRoutes(request);
    expect(routes.length).toBeGreaterThan(50);
    const titles = new Map<string, string>();
    const checked = new Set<string>();

    for (const route of routes) {
      const html = await (await request.get(route)).text();
      const head = readHead(html);
      expect(head.title, route).toBeTruthy();
      expect(
        titles.get(head.title!),
        `${route} repeats the title of ${titles.get(head.title!)}`,
      ).toBeUndefined();
      titles.set(head.title!, route);

      expect(head.description, route).toBeTruthy();
      expect(head.description!.length, route).toBeGreaterThan(20);
      expect(head.description!.length, route).toBeLessThanOrEqual(155);

      expect(pathOf(head.canonical!), route).toBe(route);
      expect(pathOf(head.ogUrl!), route).toBe(route);
      expect(head.ogTitle, route).toBeTruthy();
      expect(head.twitterCard, route).toBe('summary_large_image');
      expect(head.twitterImage, route).toBe(head.ogImage);

      if (!checked.has(head.ogImage!)) {
        checked.add(head.ogImage!);
        await expectPng(request, head.ogImage!);
      }
    }
  });

  test('every project page has its own og:image', async ({ request }) => {
    const seen = new Set<string>();
    for (const p of projects) {
      const head = readHead(await (await request.get(`/projects/${p.slug}/`)).text());
      expect(pathOf(head.ogImage!)).toBe(`/og/projects/${p.slug}.png`);
      expect(seen.has(head.ogImage!)).toBe(false);
      seen.add(head.ogImage!);
      await expectPng(request, head.ogImage!);
    }
    // Section pages share a section image; the home image is the fallback for the rest.
    const og = async (route: string) =>
      pathOf(readHead(await (await request.get(route)).text()).ogImage!);
    expect(await og('/')).toBe('/og/home.png');
    expect(await og('/projects/')).toBe('/og/projects.png');
    expect(await og('/journey/')).toBe('/og/journey.png');
    expect(await og('/resume/')).toBe('/og/resume.png');
    expect(await og('/skills/python/')).toBe('/og/home.png');
  });

  test('the title template and default read like a person wrote them', async ({ request }) => {
    const home = readHead(await (await request.get('/')).text());
    expect(home.title).toBe('Kushal Shrestha · CS student building data & AI products');
    const projectsPage = readHead(await (await request.get('/projects/')).text());
    expect(projectsPage.title).toBe('projects · Kushal Shrestha');
    expect(projectsPage.description).toMatch(/^Rant & Heal \(Best Overall, Hackfest 2025\)/);
  });

  test('keeps the RSS feed discoverable and the phone number out of the markup', async ({
    request,
  }) => {
    const html = await (await request.get('/about/')).text();
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('name="format-detection" content="telephone=no"');
    expect(html).toContain('name="robots" content="index, follow"');
    expect(html).not.toMatch(/telephone"?:/i);
  });
});

test.describe('structured data', () => {
  const ldOf = (html: string): unknown[] =>
    [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) =>
      JSON.parse(m[1]!),
    );

  for (const route of ['/', '/about/']) {
    test(`${route} has one valid Person`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      const [person, ...rest] = ldOf(html) as Record<string, unknown>[];
      expect(rest).toEqual([]);
      expect(person).toMatchObject({
        '@type': 'Person',
        name: profile.name,
        jobTitle: 'Computer Science student',
        sameAs: [profile.links.github.href, profile.links.linkedin.href],
      });
      expect(JSON.stringify(person)).not.toMatch(/telephone/i);
    });
  }

  test('other pages carry none', async ({ request }) => {
    for (const route of ['/projects/', '/resume/', '/skills/python/']) {
      expect(ldOf(await (await request.get(route)).text())).toEqual([]);
    }
  });
});

test.describe('sitemap, robots, manifest and icons', () => {
  test('sitemap.xml lists every page, detail pages included, with absolute URLs', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
    const routes = await builtRoutes(request);
    expect([...locs].sort()).toEqual([...routes].sort());
    expect(locs).toContain('/projects/zenith/');
    expect(locs).toContain('/skills/python/');
    expect(locs).toContain('/leadership/achievements/hackfest-2025/');
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T/);
  });

  test('robots.txt allows everything and points at the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/Allow: \//);
    expect(body).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
  });

  test('the manifest and every icon it names exist', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest).toMatchObject({
      short_name: 'kushal',
      theme_color: '#0c0f0d',
      background_color: '#0c0f0d',
      display: 'browser',
    });
    for (const icon of manifest.icons as { src: string; type: string }[]) {
      const r = await request.get(icon.src);
      expect(r.status(), icon.src).toBe(200);
      expect(r.headers()['content-type']).toBe(icon.type);
    }
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toContain('512x512');
  });

  test('the page head links the SVG icon, the Apple icon and the manifest', async ({
    request,
    page,
  }) => {
    await page.goto('/');
    const icon = await page.locator('link[rel="icon"]').getAttribute('href');
    expect((await request.get(icon!)).status()).toBe(200);
    const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    const png = await request.get(apple!);
    expect(png.headers()['content-type']).toBe('image/png');
    expect((await png.body()).readUInt32BE(16)).toBe(180);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest/);
  });
});

test.describe('the 404 page', () => {
  const missing = async (page: Page, path: string) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  };

  test('shows the path as a shell error and suggests the closest page', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await missing(page, '/projects/zenit/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('cd /projects/zenit/');
    await expect(page.getByTestId('not-found-error')).toHaveText(
      'portfolio-sh: no such file or directory: /projects/zenit/',
    );
    const suggestion = page.getByRole('link', { name: '/projects/zenith/' });
    await expect(suggestion).toBeVisible();
    await expect(page.locator('main')).toContainText('did you mean: /projects/zenith/');
    await expect(page).toHaveTitle('page not found · Kushal Shrestha');
    await expect(page.locator('meta[name="robots"]').last()).toHaveAttribute('content', /noindex/);
    // The document itself is a 404, which Chrome logs once; nothing else may be.
    expect(errors.filter((e) => !/status of 404/.test(e))).toEqual([]);

    await suggestion.click();
    await expect(page).toHaveURL(/\/projects\/zenith\/$/);
  });

  test('suggests a skill for a typo in a skill page', async ({ page }) => {
    await missing(page, '/skills/pyhton/');
    await expect(page.getByRole('link', { name: '/skills/python/' })).toBeVisible();
  });

  test('points a nested unknown path at the nearest page above it', async ({ page }) => {
    for (const [path, parent] of [
      ['/projects/nope/', '/projects/'],
      ['/skills/nope/', '/skills/'],
      ['/leadership/achievements/nope/', '/leadership/achievements/'],
      ['/projects/zenith/nope/', '/projects/zenith/'],
    ] as const) {
      await missing(page, path);
      await expect(page.locator('main')).toContainText(`did you mean: ${parent}`);
      await expect(page.getByRole('link', { name: parent, exact: true })).toBeVisible();
    }
  });

  test('lists the top-level pages like `ls ~` and the dock still works', async ({ page }) => {
    await missing(page, '/that/path');
    await expect(page.getByTestId('not-found-error')).toContainText('/that/path');
    await expect(page.locator('main')).toContainText('did you mean one of these?');
    const list = page.locator('main ul');
    for (const name of [
      'dashboard/',
      'about.md',
      'projects/',
      'experience/',
      'leadership/',
      'skills/',
      'resume.txt',
      'journey/',
      'guide.md',
    ]) {
      await expect(list.getByRole('link', { name })).toBeVisible();
    }
    await expect(page.locator('.dock')).toBeVisible();
    await page.keyboard.press(':');
    await expect(page.locator('#dock-cmd')).toBeFocused();
    await page.keyboard.type('open projects');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/$/);
  });

  test('is usable and accessible', async ({ page }) => {
    await missing(page, '/projects/zenit/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expectNoA11yViolations(page);
  });
});

test.describe('details', () => {
  test('external links end in an arrow that screen readers skip; internal ones do not', async ({
    page,
  }) => {
    await page.goto('/projects/');
    const after = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el, '::after').content);
    expect(await after('a[href^="https://github.com"]')).toContain('↗');
    expect(await after('a[href^="/projects/"]')).toBe('none');
    await page.goto('/about/');
    expect(await after('a[href^="mailto:"]')).toBe('none');
  });

  test('smooth scrolling is on only when motion is welcome', async ({ page }, info) => {
    await page.goto('/guide/');
    const behavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(behavior).toBe(info.project.name === 'desktop-reduced-motion' ? 'auto' : 'smooth');
  });

  test('the resume ends with its build date', async ({ page }) => {
    await page.goto('/resume/');
    await expect(page.locator('pre.resume-text')).toContainText(
      /-- EOF --\s+\(built \d{4}-\d{2}-\d{2}\)/,
    );
    await expect(page.getByTestId('build-date')).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('print: black on white, no chrome, URLs after external links, boxes keep borders', async ({
    page,
  }) => {
    await page.goto('/projects/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('nav[aria-label="Pages"]')).toBeHidden();
    await expect(page.locator('.dock')).toBeHidden();
    const style = await page.evaluate(() => {
      const link = document.querySelector('a[href^="https://github.com"]')!;
      const box = document.querySelector('.box-title')?.parentElement;
      return {
        bg: getComputedStyle(document.body).backgroundColor,
        color: getComputedStyle(document.querySelector('main')!).color,
        after: getComputedStyle(link, '::after').content,
        border: box ? getComputedStyle(box).borderTopWidth : null,
        titleBg: getComputedStyle(document.querySelector('.box-title')!).backgroundColor,
      };
    });
    expect(style.bg).toBe('rgb(255, 255, 255)');
    expect(style.color).toBe('rgb(0, 0, 0)');
    expect(style.after).toMatch(/^" \(https:\/\/github\.com\/.+\)"$/);
    expect(style.border).toBe('1px');
    expect(style.titleBg).toBe('rgb(255, 255, 255)');
  });
});

test.describe('copy the email', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
  });

  const readClipboard = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

  test('the dashboard contact box copies the email and says so, then clears', async ({ page }) => {
    await page.goto('/dashboard/');
    await page.getByRole('button', { name: 'copy email to clipboard' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'copied ✓' })).toBeVisible();
    expect(await readClipboard(page)).toBe(profile.email);
    await expect(page.getByRole('status').filter({ hasText: 'copied ✓' })).toHaveCount(0, {
      timeout: 4000,
    });
  });

  test("the man page's SEE ALSO copies it too", async ({ page }) => {
    await page.goto('/about/');
    await page.evaluate(() => navigator.clipboard.writeText('nothing yet'));
    await page.getByRole('button', { name: 'copy email to clipboard' }).click();
    await expect.poll(() => readClipboard(page)).toBe(profile.email);
  });

  test('the shell’s contact output has a [copy] item', async ({ page }) => {
    await page.addInitScript(() => window.sessionStorage.setItem('psh:booted', '1'));
    await page.goto('/');
    const input = page.locator('#cmd');
    await expect(input).toBeEnabled();
    await input.fill('contact');
    await input.press('Enter');
    const log = page.getByRole('log');
    await expect(log.getByRole('link', { name: profile.email })).toBeVisible();
    await log.getByRole('button', { name: 'copy email to clipboard' }).click();
    await expect.poll(() => readClipboard(page)).toBe(profile.email);
    await expect(log).toContainText('copied ✓');
  });

  test('a failing clipboard says so instead of throwing', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new Error('denied')) },
        configurable: true,
      });
    });
    await page.goto('/dashboard/');
    await page.getByRole('button', { name: 'copy email to clipboard' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'copy failed' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
