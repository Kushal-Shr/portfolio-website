import { describe, expect, it } from 'vitest';
import { cwdForRoute, cwdFromPathname } from '@/lib/shell/route';
import { ctx } from './helpers';

describe('cwdForRoute', () => {
  it('maps a directory page to itself', () => {
    expect(cwdForRoute(ctx.fs, '/')).toBe('~');
    expect(cwdForRoute(ctx.fs, '/projects/')).toBe('~/projects');
    expect(cwdForRoute(ctx.fs, '/projects/zenith/')).toBe('~/projects/zenith');
  });

  it('maps a leaf page to its parent directory', () => {
    expect(cwdForRoute(ctx.fs, '/about/')).toBe('~');
    expect(cwdForRoute(ctx.fs, '/resume/')).toBe('~');
  });

  it('tolerates a missing slash and a query', () => {
    expect(cwdForRoute(ctx.fs, '/projects/zenith')).toBe('~/projects/zenith');
    expect(cwdForRoute(ctx.fs, '/skills/?section=cloud')).toBe('~/skills');
  });

  it('returns undefined for unknown URLs so the 404 keeps the cwd', () => {
    expect(cwdForRoute(ctx.fs, '/nope/')).toBeUndefined();
  });
});

describe('cwdFromPathname', () => {
  it('derives the same cwd as the filesystem for every page', () => {
    for (const [path, node] of Object.entries(ctx.fs)) {
      if (!node.route) continue;
      if (node.type === 'file' && !node.own) continue;
      expect(cwdFromPathname(node.route), node.route).toBe(cwdForRoute(ctx.fs, node.route));
      void path;
    }
  });

  it('returns undefined for unknown URLs', () => {
    expect(cwdFromPathname('/nope/')).toBeUndefined();
    expect(cwdFromPathname('/about/extra/')).toBeUndefined();
  });
});
