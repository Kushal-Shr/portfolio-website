export const ROUTES = [
  { key: 'shell', file: '~', href: '/', label: 'shell', prompt: null, artboard: 'Main' },
  {
    key: 'dashboard',
    file: '~/dashboard/',
    href: '/dashboard/',
    label: 'dashboard',
    prompt: null,
    artboard: 'Tui',
  },
  {
    key: 'about',
    file: '~/about.md',
    href: '/about/',
    label: 'about',
    prompt: 'man kushal',
    artboard: 'Man',
  },
  {
    key: 'projects',
    file: '~/projects/',
    href: '/projects/',
    label: 'projects',
    prompt: 'ls -l ~/projects',
    artboard: 'Projects',
  },
  {
    key: 'experience',
    file: '~/experience/',
    href: '/experience/',
    label: 'experience',
    prompt: 'git log --graph ~/experience',
    artboard: 'Experience',
  },
  {
    key: 'leadership',
    file: '~/leadership/',
    href: '/leadership/',
    label: 'leadership',
    prompt: 'ps aux --leadership',
    artboard: 'Leadership',
  },
  {
    key: 'skills',
    file: '~/skills/',
    href: '/skills/',
    label: 'skills',
    prompt: 'apt list --installed',
    artboard: 'Skills',
  },
  {
    key: 'resume',
    file: '~/resume.txt',
    href: '/resume/',
    label: 'resume',
    prompt: 'cat resume.txt',
    artboard: 'Resume',
  },
  {
    key: 'journey',
    file: '~/journey/',
    href: '/journey/',
    label: 'journey',
    prompt: 'tail -f ~/journey/log',
    artboard: 'Journey',
  },
  {
    key: 'guide',
    file: '~/guide.md',
    href: '/guide/',
    label: 'guide',
    prompt: 'tldr portfolio-sh',
    artboard: 'Guide',
  },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];

/** Maps any pathname (with or without trailing slash, nested or unknown) to its nav tab. */
export function activeRouteKey(pathname: string): RouteKey {
  const first = pathname.split('/').filter(Boolean)[0];
  const match = ROUTES.find((route) => route.key !== 'shell' && route.key === first);
  return match?.key ?? 'shell';
}
