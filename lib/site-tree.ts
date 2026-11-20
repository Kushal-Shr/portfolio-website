import type { Achievement, Experience, LeadershipRole, Project, SkillGroup } from '@/content/types';
import { JOURNEY_PAGE_SIZE, type JourneyMeta } from './journey/types';
import type { RouteKey } from './routes';
import { slugify } from './slug';

export type SiteNode = {
  /** Virtual path: `~`, `~/projects`, `~/projects/zenith`, `~/about.md`. */
  path: string;
  /** Route (`/projects/zenith/`). Absent for plain files that only `cat` can read. */
  href?: string;
  kind: 'dir' | 'file';
  title: string;
  /** Which nav tab is active on this page. */
  section: RouteKey;
  /** Skill pages: the box the skill belongs to (`languages`, `ai-data`, `cloud`). */
  group?: SkillGroup['key'];
  /** A directory that `ls` and `tree` show only part of (the journey: newest 30 entries). */
  cap?: { dirs: number; hint: string };
  children?: SiteNode[];
};

export type JourneyNode = Pick<JourneyMeta, 'slug' | 'date' | 'day'>;

export const JOURNEY_ARCHIVE_PATH = '~/journey/archive.log';

export type SiteContent = {
  projects: readonly Project[];
  experience: readonly Experience[];
  leadership: readonly LeadershipRole[];
  achievements: readonly Achievement[];
  skillGroups: readonly SkillGroup[];
};

export type SkillEntry = { name: string; slug: string; group: SkillGroup['key'] };

/** Every skill that gets a page: all packages plus the "also used" names, in content order. */
export function skillEntries(groups: readonly SkillGroup[]): SkillEntry[] {
  return groups.flatMap((g) =>
    [...g.lists.flatMap((l) => l.packages), ...g.alsoUsed].map((name) => ({
      name,
      slug: slugify(name),
      group: g.key,
    })),
  );
}

const file = (path: string, title: string, section: RouteKey, href?: string): SiteNode => ({
  path,
  kind: 'file',
  title,
  section,
  ...(href ? { href } : {}),
});

const dir = (
  path: string,
  href: string,
  title: string,
  section: RouteKey,
  children: SiteNode[],
  extra: Partial<SiteNode> = {},
): SiteNode => ({ path, href, kind: 'dir', title, section, children, ...extra });

/** An item directory: a page that holds its own `README.md` (and optional extra files). */
const item = (
  parent: string,
  parentHref: string,
  slug: string,
  title: string,
  section: RouteKey,
  extra: Partial<SiteNode> = {},
  files: string[] = ['README.md'],
): SiteNode => {
  const path = `${parent}/${slug}`;
  return dir(
    path,
    `${parentHref}${slug}/`,
    title,
    section,
    files.map((f) => file(`${path}/${f}`, f, section)),
    extra,
  );
};

/**
 * The one map of the site. The shell's filesystem, static params, `cd`/`open` and (later) the
 * sitemap and 404 suggestions all derive from it.
 */
export function buildSiteTree(
  content: SiteContent,
  journeyEntries: readonly JourneyNode[] = [],
): SiteNode {
  const { projects, experience, leadership, achievements, skillGroups } = content;

  const projectDirs = projects.map((p) =>
    item('~/projects', '/projects/', p.slug, p.name, 'projects', {}, [
      'README.md',
      'architecture.txt',
    ]),
  );
  const experienceDirs = experience.map((e) =>
    item('~/experience', '/experience/', e.id, `${e.title} @ ${e.orgShort ?? e.org}`, 'experience'),
  );
  const achievementDirs = achievements.map((a) =>
    item('~/leadership/achievements', '/leadership/achievements/', a.id, a.event, 'leadership'),
  );
  const roleDirs = leadership.map((l) =>
    item('~/leadership', '/leadership/', l.slug, l.role, 'leadership'),
  );
  const skillDirs = skillEntries(skillGroups).map((s) =>
    item('~/skills', '/skills/', s.slug, s.name, 'skills', { group: s.group }),
  );
  // Newest first, like the page; the archive file lists every one of them.
  const journeyDirs = [...journeyEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((j) => item('~/journey', '/journey/', j.slug, `day ${j.day} · ${j.date}`, 'journey'));

  return dir('~', '/', 'home', 'shell', [
    dir('~/dashboard', '/dashboard/', 'dashboard', 'dashboard', [
      file('~/dashboard/index.tui', 'index.tui', 'dashboard'),
    ]),
    file('~/about.md', 'about', 'about', '/about/'),
    dir('~/projects', '/projects/', 'projects', 'projects', projectDirs),
    dir('~/experience', '/experience/', 'experience', 'experience', [
      file('~/experience/README.md', 'README.md', 'experience'),
      ...experienceDirs,
    ]),
    dir('~/leadership', '/leadership/', 'leadership', 'leadership', [
      ...roleDirs,
      dir('~/leadership/achievements', '/leadership/achievements/', 'achievements', 'leadership', [
        file('~/leadership/achievements/README.md', 'README.md', 'leadership'),
        ...achievementDirs,
      ]),
    ]),
    dir('~/skills', '/skills/', 'skills', 'skills', [
      file('~/skills/README.md', 'README.md', 'skills'),
      ...skillDirs,
    ]),
    file('~/resume.txt', 'resume', 'resume', '/resume/'),
    dir(
      '~/journey',
      '/journey/',
      'journey',
      'journey',
      [...journeyDirs, file(JOURNEY_ARCHIVE_PATH, 'archive', 'journey', '/journey/archive/')],
      { cap: { dirs: JOURNEY_PAGE_SIZE, hint: 'older: open archive' } },
    ),
    file('~/guide.md', 'guide', 'guide', '/guide/'),
  ]);
}

export function flatten(tree: SiteNode): SiteNode[] {
  return [tree, ...(tree.children ?? []).flatMap(flatten)];
}

const withSlash = (pathname: string): string => {
  const path = pathname.split(/[?#]/)[0] ?? '/';
  return path.endsWith('/') ? path : `${path}/`;
};

export function findByHref(tree: SiteNode, pathname: string): SiteNode | undefined {
  const href = withSlash(pathname);
  return flatten(tree).find((n) => n.href === href);
}

export function findByPath(tree: SiteNode, path: string): SiteNode | undefined {
  return flatten(tree).find((n) => n.path === path.replace(/\/$/, ''));
}

/** The working directory for a URL: a directory page is its own cwd, a leaf page its parent. */
export function cwdForHref(tree: SiteNode, pathname: string): string | undefined {
  const node = findByHref(tree, pathname);
  if (!node) return undefined;
  if (node.kind === 'dir') return node.path;
  return node.path.slice(0, node.path.lastIndexOf('/')) || '~';
}

export function parentOf(tree: SiteNode, node: SiteNode): SiteNode | undefined {
  return flatten(tree).find((n) => n.children?.includes(node));
}

/** Sibling pages (nodes with an `href`) of a page, in tree order. */
export function pageSiblings(tree: SiteNode, node: SiteNode): SiteNode[] {
  return (parentOf(tree, node)?.children ?? []).filter((n) => n.href);
}
