import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import { BRAND } from '@/lib/brand';
import {
  MAX_DESCRIPTION,
  achievementMeta,
  clip,
  defaultTitle,
  jobMeta,
  projectMeta,
  roleMeta,
  routeDescriptions,
  siteDescription,
  skillMeta,
} from '@/lib/seo/copy';
import { personJsonLd, serializeJsonLd } from '@/lib/seo/jsonld';
import { pageMetadata } from '@/lib/seo/metadata';
import { sitemapEntries } from '@/lib/seo/sitemap';
import { buildSiteTree, flatten, skillEntries } from '@/lib/site-tree';
import { shellContent, siteTree } from '@/lib/site-data';
import { fixtureMeta } from './shell/helpers';

describe('clip', () => {
  it('leaves short text alone', () => {
    expect(clip('short and sweet')).toBe('short and sweet');
  });

  it('cuts at a word boundary and ends with an ellipsis', () => {
    const out = clip('one two three four five six seven', 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/ …$/);
    expect(out.startsWith('one two three')).toBe(true);
  });

  it('collapses whitespace first', () => {
    expect(clip('a   b\n c')).toBe('a b c');
  });
});

describe('descriptions', () => {
  const all: [string, string][] = [
    ['site', siteDescription],
    ...Object.entries(routeDescriptions),
    ...projects.map((p): [string, string] => [`project ${p.slug}`, projectMeta(p).description]),
    ...experience.map((e): [string, string] => [`job ${e.id}`, jobMeta(e).description]),
    ...leadership.map((l): [string, string] => [`role ${l.slug}`, roleMeta(l).description]),
    ...achievements.map((a): [string, string] => [`win ${a.id}`, achievementMeta(a).description]),
    ...skillEntries(skillGroups).map((s): [string, string] => [
      `skill ${s.slug}`,
      skillMeta(s).description,
    ]),
  ];

  it.each(all)('%s fits a search result (≤155 characters, not empty)', (_name, text) => {
    expect(text.length).toBeGreaterThan(20);
    expect(text.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it('has no placeholder text in any description', () => {
    for (const [, text] of all) expect(text).not.toMatch(/TODO|todo\(|\[object/);
  });

  it('describes the projects page from content, not by hand', () => {
    for (const p of projects) expect(routeDescriptions.projects).toContain(p.name);
    expect(routeDescriptions.projects).toContain('Hackfest 2025');
    expect(routeDescriptions.projects.endsWith('Built by Kushal Shrestha.')).toBe(true);
  });

  it('writes the detail pages the way the phase asks', () => {
    const zenith = projects.find((p) => p.slug === 'zenith')!;
    expect(projectMeta(zenith).description).toBe(`Zenith: ${zenith.shortSummary}`);
    expect(projectMeta(zenith).keywords).toContain('typescript');

    const job = experience[0]!;
    expect(jobMeta(job).title).toBe(`${job.title} @ ${job.orgShort ?? job.org} (2025–2026)`);
    expect(jobMeta(job).description).toContain(job.bullets[0]!.replace(/[.\s]+$/, ''));

    const python = skillEntries(skillGroups).find((s) => s.slug === 'python')!;
    expect(skillMeta(python).description).toMatch(/^Python: where Kushal Shrestha has used it — /);
  });

  it('does not overclaim in the default title', () => {
    expect(defaultTitle).toContain('CS student');
    expect(defaultTitle).not.toMatch(/engineer/i);
  });
});

describe('pageMetadata', () => {
  it('sets title, canonical, Open Graph and Twitter together', () => {
    const m = pageMetadata({ title: 'projects', description: 'd', path: '/projects/' });
    expect(m.title).toBe('projects');
    expect(m.alternates?.canonical).toBe('/projects/');
    expect(m.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Kushal Shrestha',
      locale: 'en_US',
      url: '/projects/',
      title: 'projects · Kushal Shrestha',
    });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('keeps the RSS alternate, which a page-level `alternates` would otherwise replace', () => {
    const m = pageMetadata({ title: 't', description: 'd', path: '/x/' });
    expect(JSON.stringify(m.alternates?.types)).toContain('/journey/rss.xml');
  });

  it('can skip the title template and mark an article', () => {
    const home = pageMetadata({ title: 'T', absoluteTitle: true, description: 'd', path: '/' });
    expect(home.title).toEqual({ absolute: 'T' });
    expect(home.openGraph).toMatchObject({ title: 'T' });
    const post = pageMetadata({
      title: 'day 1',
      description: 'd',
      path: '/journey/2026-11-19/',
      article: { publishedTime: '2026-11-19', tags: ['a'] },
    });
    expect(post.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-11-19' });
  });
});

describe('Person JSON-LD', () => {
  const data = personJsonLd();

  it('is a schema.org Person with honest, public facts', () => {
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Kushal Shrestha');
    expect(data.jobTitle).toBe('Computer Science student');
    expect(data.affiliation.name).toBe('Webster University');
    expect(data.address.addressLocality).toBe('St. Louis');
    expect(data.sameAs).toEqual([profile.links.github.href, profile.links.linkedin.href]);
    expect(data.knowsAbout).toContain('Python');
    expect(data.email).toBe(`mailto:${profile.email}`);
  });

  it('never carries a phone number', () => {
    const json = serializeJsonLd(data);
    expect(json).not.toMatch(/telephone/i);
    expect(json).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
  });

  it('serializes to valid JSON with every "<" escaped', () => {
    const nasty = { note: '</script><script>alert(1)</script>', ok: 'a<b' };
    const json = serializeJsonLd(nasty);
    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual(nasty);
    expect(JSON.parse(serializeJsonLd(data))).toEqual(JSON.parse(JSON.stringify(data)));
  });
});

describe('sitemap', () => {
  const tree = buildSiteTree(shellContent, fixtureMeta);
  const built = new Date('2026-11-20T10:00:00Z');
  const entries = sitemapEntries(tree, 'https://kushal.example/', built);
  const hrefs = flatten(tree).flatMap((n) => (n.href ? [n.href] : []));

  it('lists every page of the site tree, detail pages included', () => {
    expect(entries.map((e) => e.url)).toEqual(hrefs.map((h) => `https://kushal.example${h}`));
    expect(entries.map((e) => e.url)).toContain('https://kushal.example/projects/zenith/');
    expect(entries.map((e) => e.url)).toContain('https://kushal.example/skills/python/');
  });

  it('dates journey entries by their day and everything else by the build', () => {
    const entry = entries.find((e) => e.url.endsWith('/journey/2026-11-19/'))!;
    expect(entry.lastModified).toEqual(new Date('2026-11-19T00:00:00Z'));
    expect(entries.find((e) => e.url.endsWith('/projects/'))!.lastModified).toEqual(built);
  });

  it('has no duplicates', () => {
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
    expect(siteTree.href).toBe('/');
  });
});

describe('brand tokens', () => {
  const css = readFileSync('app/globals.css', 'utf8');
  const token = (name: string) =>
    new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1];

  it('match the @theme block in globals.css', () => {
    expect(BRAND.bg).toBe(token('bg'));
    expect(BRAND.bgRaised).toBe(token('bg-raised'));
    expect(BRAND.fg).toBe(token('fg'));
    expect(BRAND.fgDim).toBe(token('fg-dim'));
    expect(BRAND.line).toBe(token('line'));
    expect(BRAND.lineStrong).toBe(token('line-strong'));
    expect(BRAND.green).toBe(token('green'));
    expect(BRAND.blue).toBe(token('blue'));
    expect(BRAND.yellow).toBe(token('yellow'));
    expect(BRAND.portraitBg).toBe(token('portrait-bg'));
  });

  it('match the app icon', () => {
    const svg = readFileSync('app/icon.svg', 'utf8');
    expect(svg).toContain(`fill="${BRAND.bg}"`);
    expect(svg).toContain(`stroke="${BRAND.green}"`);
  });
});
