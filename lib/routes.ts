export const ROUTES = [
  { key: 'shell', href: '/', label: 'shell', prompt: null, artboard: 'Main' },
  { key: 'dashboard', href: '/dashboard/', label: 'dashboard', prompt: null, artboard: 'Tui' },
  { key: 'about', href: '/about/', label: 'about', prompt: 'man kushal', artboard: 'Man' },
  {
    key: 'projects',
    href: '/projects/',
    label: 'projects',
    prompt: 'ls -l ~/projects',
    artboard: 'Projects',
  },
  {
    key: 'experience',
    href: '/experience/',
    label: 'experience',
    prompt: 'git log --graph ~/experience.log',
    artboard: 'Experience',
  },
  {
    key: 'leadership',
    href: '/leadership/',
    label: 'leadership',
    prompt: 'ps aux --leadership',
    artboard: 'Leadership',
  },
  {
    key: 'skills',
    href: '/skills/',
    label: 'skills',
    prompt: 'apt list --installed',
    artboard: 'Skills',
  },
  {
    key: 'resume',
    href: '/resume/',
    label: 'resume',
    prompt: 'cat resume.txt',
    artboard: 'Resume',
  },
  {
    key: 'journey',
    href: '/journey/',
    label: 'journey',
    prompt: 'tail -f ~/journey/log',
    artboard: 'Journey',
  },
  { key: 'guide', href: '/guide/', label: 'guide', prompt: 'tldr portfolio-sh', artboard: 'Guide' },
] as const;

export type RouteKey = (typeof ROUTES)[number]['key'];

/** Maps any pathname (with or without trailing slash, nested or unknown) to its nav tab. */
export function activeRouteKey(pathname: string): RouteKey {
  const first = pathname.split('/').filter(Boolean)[0];
  const match = ROUTES.find((route) => route.key !== 'shell' && route.key === first);
  return match?.key ?? 'shell';
}
