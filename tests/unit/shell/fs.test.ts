import { describe, expect, it } from 'vitest';
import { shellContent } from '@/lib/site-data';
import { buildVirtualFs } from '@/lib/shell/fs';
import { projects } from '@/content/projects';
import { ctx, plain } from './helpers';
import type { Line } from '@/lib/shell/types';

describe('buildVirtualFs', () => {
  it('gives every project a folder with a README, an architecture file and its page', () => {
    for (const p of projects) {
      const dir = `~/projects/${p.slug}`;
      expect(ctx.fs[dir]).toMatchObject({
        type: 'dir',
        route: `/projects/${p.slug}/`,
        children: ['README.md', 'architecture.txt'],
      });
      expect(ctx.fs[`${dir}/README.md`]).toMatchObject({
        type: 'file',
        route: `/projects/${p.slug}/`,
      });
      expect(ctx.fs[`${dir}/README.md`]).not.toHaveProperty('own');
    }
  });

  it('gives pages their routes and marks page files as their own', () => {
    expect(ctx.fs['~']?.route).toBe('/');
    expect(ctx.fs['~/about.md']).toMatchObject({ route: '/about/', own: true });
    expect(ctx.fs['~/resume.txt']).toMatchObject({ route: '/resume/', own: true });
    expect(ctx.fs['~/guide.md']).toMatchObject({ route: '/guide/', own: true });
    for (const dir of ['experience', 'leadership', 'skills', 'journey', 'projects', 'dashboard']) {
      expect(ctx.fs[`~/${dir}`]?.route).toBe(`/${dir}/`);
    }
    expect(ctx.fs['~/leadership/achievements']?.route).toBe('/leadership/achievements/');
    expect(ctx.fs['~/skills/python']?.route).toBe('/skills/python/');
  });

  it('keeps the old text under the renamed folders', () => {
    expect(ctx.fs['~/experience/README.md']?.type).toBe('file');
    expect(ctx.fs['~/skills/README.md']?.type).toBe('file');
    expect(ctx.fs['~/leadership/achievements/README.md']?.type).toBe('file');
    expect(ctx.fs['~/experience.log']).toBeUndefined();
    expect(ctx.fs['~/skills.txt']).toBeUndefined();
  });

  it('starts with an empty journey and accepts entries', () => {
    expect(ctx.fs['~/journey']).toMatchObject({ type: 'dir', children: [] });
    const fs = buildVirtualFs(shellContent, [
      {
        slug: '2026-11-19',
        title: '2026-11-19',
        lines: [{ kind: 'text', segments: [{ text: 'hi' }] }],
      },
    ]);
    expect(fs['~/journey']).toMatchObject({ children: ['2026-11-19'] });
    expect(fs['~/journey/2026-11-19']).toMatchObject({ route: '/journey/2026-11-19/' });
    const readme = fs['~/journey/2026-11-19/README.md'] as unknown as { lines: Line[] };
    expect(plain(readme.lines[0]!)).toBe('hi');
  });

  it('derives skill pages from content and reports usage', () => {
    const python = ctx.fs['~/skills/python/README.md'] as unknown as { lines: Line[] };
    const text = python.lines.map(plain).join('\n');
    expect(text).toContain('Package:  Python');
    expect(text).toContain('Section:  languages');
    expect(text).toMatch(/Projects: .*surgipath/);
    expect(text).toMatch(/Jobs: .*schnuck/);
  });

  it('stays small enough to ship as a lazily loaded file', () => {
    expect(JSON.stringify(ctx.fs).length).toBeLessThan(80_000);
  });

  it('is serializable plain data', () => {
    expect(JSON.parse(JSON.stringify(ctx.fs))).toEqual(ctx.fs);
  });
});
