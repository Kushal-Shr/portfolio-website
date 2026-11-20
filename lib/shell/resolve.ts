import type { VirtualFs } from './types';

/**
 * Resolves a user-typed path against `cwd`. Returns `null` for anything outside `~`
 * (absolute paths), and keeps `..` at `~` from escaping.
 */
export function resolve(arg: string | undefined, cwd: string): string | null {
  if (!arg || arg === '~') return '~';
  if (arg.startsWith('/')) return null;
  const home = arg === '~' || arg.startsWith('~/');
  const parts = home
    ? arg.slice(2).split('/')
    : [...cwd.replace(/^~\/?/, '').split('/'), ...arg.split('/')];
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.length ? `~/${out.join('/')}` : '~';
}

export const isDir = (fs: VirtualFs, path: string | null): boolean =>
  path !== null && fs[path]?.type === 'dir';

export const isFile = (fs: VirtualFs, path: string | null): boolean =>
  path !== null && fs[path]?.type === 'file';

export const basename = (path: string): string => path.split('/').pop() ?? path;

export const joinPath = (dir: string, name: string): string => `${dir}/${name}`;
