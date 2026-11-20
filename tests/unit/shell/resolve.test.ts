import { describe, expect, it } from 'vitest';
import { basename, isDir, isFile, resolve } from '@/lib/shell/resolve';
import { ctx } from './helpers';

describe('resolve', () => {
  it('maps empty and ~ to home', () => {
    expect(resolve(undefined, '~/projects')).toBe('~');
    expect(resolve('', '~/projects')).toBe('~');
    expect(resolve('~', '~/projects')).toBe('~');
  });

  it('treats ~/x as absolute-in-home', () => {
    expect(resolve('~/leadership', '~/projects')).toBe('~/leadership');
  });

  it('joins relative paths to cwd', () => {
    expect(resolve('zenith.md', '~/projects')).toBe('~/projects/zenith.md');
    expect(resolve('projects', '~')).toBe('~/projects');
  });

  it('handles . and ..', () => {
    expect(resolve('.', '~/projects')).toBe('~/projects');
    expect(resolve('..', '~/projects')).toBe('~');
    expect(resolve('../..', '~/projects')).toBe('~');
    expect(resolve('~/projects/../leadership', '~')).toBe('~/leadership');
  });

  it('keeps .. at ~ from escaping', () => {
    expect(resolve('..', '~')).toBe('~');
    expect(resolve('../../..', '~')).toBe('~');
  });

  it('ignores trailing slashes', () => {
    expect(resolve('projects/', '~')).toBe('~/projects');
  });

  it('returns null outside home', () => {
    expect(resolve('/etc', '~')).toBeNull();
    expect(resolve('/', '~/projects')).toBeNull();
  });

  it('exposes isDir, isFile and basename', () => {
    expect(isDir(ctx.fs, '~/projects')).toBe(true);
    expect(isFile(ctx.fs, '~/about.md')).toBe(true);
    expect(isDir(ctx.fs, '~/about.md')).toBe(false);
    expect(isDir(ctx.fs, null)).toBe(false);
    expect(basename('~/projects/zenith.md')).toBe('zenith.md');
  });
});
