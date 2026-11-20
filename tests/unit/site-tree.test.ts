import { describe, expect, it } from 'vitest';
import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import { ROUTES } from '@/lib/routes';
import { shellContent, siteTree } from '@/lib/site-data';
import {
  buildSiteTree,
  cwdForHref,
  findByHref,
  findByPath,
  flatten,
  pageSiblings,
  skillEntries,
} from '@/lib/site-tree';
import { cwdForRoute } from '@/lib/shell/route';
import { matchesSkill } from '@/lib/skills';
import { ctx } from './shell/helpers';

const nodes = flatten(siteTree);
const pages = nodes.filter((n) => n.href);

describe('site tree', () => {
  it('has the documented shape', () => {
    expect(siteTree.children?.map((c) => c.path)).toEqual([
      '~/dashboard',
      '~/about.md',
      '~/projects',
      '~/experience',
      '~/leadership',
      '~/skills',
      '~/resume.txt',
      '~/journey',
      '~/guide.md',
    ]);
    expect(findByPath(siteTree, '~/projects')?.children?.map((c) => c.path)).toEqual(
      projects.map((p) => `~/projects/${p.slug}`),
    );
    expect(findByPath(siteTree, '~/projects/zenith')?.children?.map((c) => c.path)).toEqual([
      '~/projects/zenith/README.md',
      '~/projects/zenith/architecture.txt',
    ]);
    expect(findByPath(siteTree, '~/leadership')?.children?.map((c) => c.path)).toEqual([
      '~/leadership/president',
      '~/leadership/coding-team-lead',
      '~/leadership/senator',
      '~/leadership/achievements',
    ]);
  });

  it('gives every directory an href, and every item its own page', () => {
    for (const n of nodes.filter((x) => x.kind === 'dir')) expect(n.href, n.path).toBeTruthy();
    for (const slug of projects.map((p) => p.slug)) {
      expect(findByHref(siteTree, `/projects/${slug}/`)?.path).toBe(`~/projects/${slug}`);
    }
    for (const e of experience) expect(findByHref(siteTree, `/experience/${e.id}/`)).toBeDefined();
    for (const l of leadership)
      expect(findByHref(siteTree, `/leadership/${l.slug}/`)).toBeDefined();
    for (const a of achievements) {
      expect(findByHref(siteTree, `/leadership/achievements/${a.id}/`)).toBeDefined();
    }
  });

  it('has unique hrefs that start and end with a slash', () => {
    const hrefs = pages.map((n) => n.href as string);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const h of hrefs) {
      expect(h.startsWith('/')).toBe(true);
      expect(h.endsWith('/')).toBe(true);
    }
  });

  it('uses URL-safe slugs', () => {
    for (const n of nodes.filter((x) => x.path !== '~')) {
      const name = n.path.slice(n.path.lastIndexOf('/') + 1);
      if (n.kind === 'dir') expect(name, n.path).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('mirrors URLs: a node href starts with its parent directory href', () => {
    for (const parent of nodes.filter((n) => n.children)) {
      for (const child of parent.children ?? []) {
        if (child.href && parent.href)
          expect(child.href.startsWith(parent.href), child.path).toBe(true);
      }
    }
  });

  it('never lets a leadership role take the achievements slug', () => {
    expect(leadership.map((l) => l.slug)).not.toContain('achievements');
    expect(new Set(leadership.map((l) => l.slug)).size).toBe(leadership.length);
  });

  it('lists every ROUTES entry at depth 0 or 1 with a matching section', () => {
    for (const route of ROUTES) {
      const node = findByHref(siteTree, route.href);
      expect(node, route.href).toBeDefined();
      expect(node?.section, route.href).toBe(route.key);
      const depth = node?.path === '~' ? 0 : (node?.path.split('/').length ?? 9) - 1;
      expect(depth).toBeLessThanOrEqual(1);
      expect(node?.path, route.href).toBe(route.file.replace(/\/$/, ''));
    }
  });

  it('keeps detail pages in their section tab', () => {
    expect(findByHref(siteTree, '/projects/zenith/')?.section).toBe('projects');
    expect(findByHref(siteTree, '/skills/python/')?.section).toBe('skills');
    expect(findByHref(siteTree, '/leadership/achievements/hackfest-2025/')?.section).toBe(
      'leadership',
    );
  });

  it('finds pages with or without a trailing slash', () => {
    expect(findByHref(siteTree, '/projects/zenith')?.path).toBe('~/projects/zenith');
    expect(findByHref(siteTree, '/projects/zenith/?x=1#top')?.path).toBe('~/projects/zenith');
    expect(findByHref(siteTree, '/nope/')).toBeUndefined();
    expect(findByPath(siteTree, '~/projects/zenith/')?.title).toBe('Zenith');
  });

  it('derives the working directory from a URL', () => {
    expect(cwdForHref(siteTree, '/')).toBe('~');
    expect(cwdForHref(siteTree, '/projects/zenith/')).toBe('~/projects/zenith');
    expect(cwdForHref(siteTree, '/about/')).toBe('~');
    expect(cwdForHref(siteTree, '/leadership/achievements/')).toBe('~/leadership/achievements');
    expect(cwdForHref(siteTree, '/nope/')).toBeUndefined();
  });

  it('agrees with the filesystem about the cwd of every page', () => {
    for (const n of pages)
      expect(cwdForRoute(ctx.fs, n.href as string), n.href).toBe(
        cwdForHref(siteTree, n.href as string),
      );
    expect(cwdForRoute(ctx.fs, '/nope/')).toBeUndefined();
  });

  it('plans journey entries in, for phase 7', () => {
    const tree = buildSiteTree(shellContent, [{ slug: '2026-11-19', title: 'a day' }]);
    expect(findByHref(tree, '/journey/2026-11-19/')?.section).toBe('journey');
  });

  it('pages siblings in content order', () => {
    const zenith = findByPath(siteTree, '~/projects/zenith')!;
    expect(pageSiblings(siteTree, zenith).map((n) => n.title)).toEqual(projects.map((p) => p.name));
  });
});

describe('skill pages', () => {
  const skills = skillEntries(skillGroups);

  it('covers every package and every "also used" name', () => {
    const names = skillGroups.flatMap((g) => [
      ...g.lists.flatMap((l) => l.packages),
      ...g.alsoUsed,
    ]);
    expect(skills.map((s) => s.name)).toEqual(names);
    expect(new Set(skills.map((s) => s.slug)).size).toBe(skills.length);
  });

  it('keeps the slugs stable (a rename is a deliberate diff)', () => {
    expect(skills.map((s) => s.slug)).toMatchInlineSnapshot(`
      [
        "sql",
        "python",
        "cpp",
        "typescript",
        "javascript",
        "react",
        "nextjs",
        "nodejs",
        "flask",
        "tailwind-css",
        "react-native",
        "streamlit",
        "p5js",
        "llm",
        "scikit-learn",
        "tensorflow",
        "data-modeling",
        "bigquery",
        "apache-airflow",
        "talend",
        "gemini",
        "rag",
        "opencv",
        "oracle",
        "fastapi",
        "aws",
        "gcp",
        "rest-apis",
        "git",
        "kubernetes",
        "jenkins",
        "firebase",
        "webrtc",
        "oauth2",
      ]
    `);
  });

  it('matches stack names to skills, case-insensitively and through aliases', () => {
    expect(matchesSkill('Python', 'python')).toBe(true);
    expect(matchesSkill('Tailwind CSS', 'Tailwind')).toBe(true);
    expect(matchesSkill('Apache Airflow', 'airflow')).toBe(true);
    expect(matchesSkill('React', 'react.js')).toBe(true);
    expect(matchesSkill('OAuth 2.0', 'oauth 2.0')).toBe(true);
    expect(matchesSkill('Next.js', 'next.js')).toBe(true);
    expect(matchesSkill('React', 'React Native')).toBe(false);
    expect(matchesSkill('Git', 'GitHub')).toBe(false);
  });

  // Names that appear in projects and jobs but deliberately have no skill page.
  const NOT_SKILLS = [
    'VS Code API',
    'vs-code-api',
    'computer-vision',
    'Prisma',
    'prisma',
    'PostgreSQL',
    'postgres',
    'LiveKit',
    'livekit',
    'agent engine',
    'front-end optimization',
    'testing',
    'traffic analytics',
    'data analysis',
    'mysql',
  ];

  it('matches every project and job stack name to a skill, or lists it as a non-skill', () => {
    const names = new Set<string>();
    for (const p of projects) for (const n of [...p.resumeStack, ...p.tags]) names.add(n);
    for (const e of experience) for (const n of e.stack) names.add(n);
    const unmatched = [...names].filter(
      (n) => !skills.some((s) => matchesSkill(s.name, n)) && !NOT_SKILLS.includes(n),
    );
    expect(unmatched).toEqual([]);
  });

  it('does not leave stale entries on the allowlist', () => {
    const names = new Set<string>();
    for (const p of projects) for (const n of [...p.resumeStack, ...p.tags]) names.add(n);
    for (const e of experience) for (const n of e.stack) names.add(n);
    for (const n of NOT_SKILLS) {
      expect(names.has(n), n).toBe(true);
      expect(
        skills.some((s) => matchesSkill(s.name, n)),
        n,
      ).toBe(false);
    }
  });
});
