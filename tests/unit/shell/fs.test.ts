import { describe, expect, it } from 'vitest';
import { achievements, experience, leadership, profile, projects, skillGroups } from '@/content';
import { learning } from '@/content/skills';
import { buildVirtualFs } from '@/lib/shell/fs';
import type { Line } from '@/lib/shell/types';
import { ctx, plain } from './helpers';

describe('buildVirtualFs', () => {
  it('has all five projects as files linking to their cards', () => {
    for (const p of projects) {
      expect(ctx.fs[`~/projects/${p.slug}.md`]).toMatchObject({
        type: 'file',
        route: `/projects/#${p.slug}`,
      });
    }
  });

  it('gives pages their routes', () => {
    expect(ctx.fs['~/about.md']?.route).toBe('/about/');
    expect(ctx.fs['~/experience.log']?.route).toBe('/experience/');
    expect(ctx.fs['~/leadership']?.route).toBe('/leadership/');
    expect(ctx.fs['~/skills.txt']?.route).toBe('/skills/');
    expect(ctx.fs['~/resume.txt']?.route).toBe('/resume/');
    expect(ctx.fs['~/journey']?.route).toBe('/journey/');
    expect(ctx.fs['~']?.route).toBeUndefined();
  });

  it('starts with an empty journey and accepts entries', () => {
    expect(ctx.fs['~/journey']).toMatchObject({ type: 'dir', children: [] });
    const fs = buildVirtualFs(
      { profile, experience, projects, leadership, achievements, skillGroups, learning },
      [{ name: '2026-11-19.md', lines: [{ kind: 'text', segments: [{ text: 'hi' }] }] }],
    );
    expect(fs['~/journey']).toMatchObject({ children: ['2026-11-19.md'] });
    expect(plain((fs['~/journey/2026-11-19.md'] as unknown as { lines: Line[] }).lines[0]!)).toBe(
      'hi',
    );
  });

  it('stays small enough to ship as a prop', () => {
    expect(JSON.stringify(ctx.fs).length).toBeLessThan(20_000);
  });

  it('is serializable plain data', () => {
    expect(JSON.parse(JSON.stringify(ctx.fs))).toEqual(ctx.fs);
  });
});
