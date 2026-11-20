import type { VirtualFs } from './types';

/**
 * The working directory for a URL, from the filesystem's own routes: a directory page is its own
 * cwd, a leaf page (`/about/`) is its parent. Unknown URLs (the 404 page) return `undefined`.
 */
export function cwdForRoute(fs: VirtualFs, pathname: string): string | undefined {
  const route = (pathname.split(/[?#]/)[0] ?? '/').replace(/\/?$/, '/');
  for (const [path, node] of Object.entries(fs)) {
    if (node.route !== route) continue;
    if (node.type === 'dir') return path;
    if (node.own) return path.slice(0, path.lastIndexOf('/')) || '~';
  }
  return undefined;
}

const SECTIONS = ['dashboard', 'projects', 'experience', 'leadership', 'skills', 'journey'];

/**
 * The working directory for a URL without the filesystem, so the dock's prompt is right before
 * `fs.json` has loaded: section and item pages are their own directory; `/about/`, `/resume/`
 * and `/guide/` are files in `~`. Unknown URLs return `undefined`.
 */
export function cwdFromPathname(pathname: string): string | undefined {
  const parts = (pathname.split(/[?#]/)[0] ?? '/').split('/').filter(Boolean);
  if (parts.length === 0) return '~';
  const [first] = parts;
  if (parts.length === 1 && ['about', 'resume', 'guide'].includes(first ?? '')) return '~';
  // `/journey/archive/` is a file page (`~/journey/archive.log`), so its cwd is the folder.
  if (first === 'journey' && parts[1] === 'archive' && parts.length === 2) return '~/journey';
  if (SECTIONS.includes(first ?? '')) return `~/${parts.join('/')}`;
  return undefined;
}
