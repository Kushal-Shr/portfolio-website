import type {
  Achievement,
  Experience,
  Guide,
  Inline,
  LeadershipRole,
  Learning,
  Profile,
  Project,
  SkillGroup,
} from '@/content/types';
import { isTodo } from '@/content/types';
import { formatRange } from '@/lib/format';
import { archiveLine, groupByMonth } from '@/lib/journey/format';
import type { JourneyMeta } from '@/lib/journey/types';
import { renderResume } from '@/lib/resume';
import {
  buildSiteTree,
  flatten,
  JOURNEY_ARCHIVE_PATH,
  skillEntries,
  type SiteNode,
} from '@/lib/site-tree';
import { matchesSkill } from '@/lib/skills';
import { link, seg, text } from './lines';
import type { FsNode, Line, VirtualFs } from './types';

export type ShellContent = {
  profile: Profile;
  experience: readonly Experience[];
  projects: readonly Project[];
  leadership: readonly LeadershipRole[];
  achievements: readonly Achievement[];
  skillGroups: readonly SkillGroup[];
  learning: readonly Learning[];
  guide: Guide;
};

const dim = (value: string): Line => text(value, 'dim');
const heading = (value: string): Line => text(value, 'warn', true);

/** Plain text lines; a leading `# ` or `──` heading is yellow, `#` headings bold too. */
function doc(lines: string[]): Line[] {
  return lines.map((value, i) =>
    i === 0 && /^#|^──/.test(value) ? text(value, 'warn', value.startsWith('#')) : text(value),
  );
}

const plainInline = (parts: readonly Inline[]): string =>
  parts.map((p) => (typeof p === 'string' ? p : p.text)).join('');

/** A journey entry as the design's file: `── date ──`, then one row per field. */
export function journeyLines(j: JourneyMeta): Line[] {
  const lines: Line[] = [text(`── ${j.date} ──`, 'warn'), text(`learned  ${j.learned}`)];
  lines.push(text(`built    ${j.built}`));
  if (j.builtLink) lines.push(link('         ↗ ', j.builtLink, j.builtLink, true));
  if (j.stuckOn) lines.push(text(`stuck on ${j.stuckOn}`));
  lines.push(text(`next     ${j.next}`));
  return lines;
}

function archiveLines(entries: readonly JourneyMeta[]): Line[] {
  if (entries.length === 0) return [dim('archive.log: no entries yet')];
  return groupByMonth(entries).flatMap((month) => [
    heading(`# ${month.label}`),
    ...month.entries.map((e): Line => {
      const { day, learned } = archiveLine(e);
      return { kind: 'text', segments: [seg(e.date, 'dir'), seg(day, 'dim'), seg(learned)] };
    }),
  ]);
}

/**
 * Builds the virtual filesystem from the site tree and `content/`. Nothing here is typed by
 * hand: every fact comes from content, so the shell can never drift from the pages.
 */
export function buildVirtualFs(
  content: ShellContent,
  journeyEntries: readonly JourneyMeta[] = [],
): VirtualFs {
  const { profile, experience, projects, leadership, achievements, skillGroups, learning, guide } =
    content;
  const tree = buildSiteTree(content, journeyEntries);
  const newestFirst = [...journeyEntries].sort((a, b) => b.date.localeCompare(a.date));
  const nodes = flatten(tree);
  const parentHref = new Map<string, string | undefined>();
  for (const n of nodes) for (const c of n.children ?? []) parentHref.set(c.path, n.href);

  const lists = skillGroups.flatMap((g) => g.lists);
  const project = (slug: string) => projects.find((p) => p.slug === slug);
  const job = (id: string) => experience.find((e) => e.id === id);
  const role = (slug: string) => leadership.find((l) => l.slug === slug);
  const win = (id: string) => achievements.find((a) => a.id === id);
  const skills = skillEntries(skillGroups);

  const roleLines = (l: LeadershipRole): Line[] => {
    const lines: Line[] = [heading(`# ${l.role} · ${l.org}`)];
    if (l.summary) lines.push(text(l.summary));
    else lines.push(text(`status: ${l.status.text}`));
    for (const item of l.impact ?? []) {
      lines.push(isTodo(item) ? dim(`[${item.text}]`) : text(`- ${item}`));
    }
    return lines;
  };

  const tone = { rule: 'dim', heading: 'warn', dim: 'dim' } as const;

  const linesFor = (node: SiteNode): Line[] => {
    const path = node.path;
    const parts = path.split('/');
    const [, section, slug, last] = parts;

    switch (path) {
      case '~/about.md':
        return doc(['# about', ...profile.about.short]);
      case '~/dashboard/index.tui':
        return doc([
          'cat: index.tui: binary file — it is a full-screen app',
          'try: open dashboard',
        ]);
      case '~/guide.md':
        return [
          heading(`# ${guide.title} ${guide.subtitle}`),
          ...guide.intro.map((p) => text(plainInline(p))),
          ...guide.quickStart.steps.map((p, i) => text(`${i + 1}. ${plainInline(p)}`)),
        ];
      case '~/resume.txt':
        return [
          ...renderResume({
            profile,
            experience,
            projects,
            leadership,
            achievements,
            skillGroups,
          }).map((line): Line => ({
            kind: 'text',
            segments: line.map((s) => seg(s.text, s.tone ? tone[s.tone] : undefined, s.bold)),
          })),
          link('↗ ', 'wget resume.pdf', profile.resume.href),
        ];
      case '~/experience/README.md': {
        const gap = ' '.repeat(19);
        return experience.flatMap((e) => [
          text(`${formatRange(e.start, e.end, 'arrow')}  ${e.title} @ ${e.orgShort ?? e.org}`),
          text(`${gap}- ${e.summary}`),
        ]);
      }
      case '~/skills/README.md':
        return [
          ...lists.map((l) => text(`${l.key.padEnd(13)}${l.packages.join(', ')}`)),
          text(`${'learning'.padEnd(13)}${learning.map((l) => l.shortName).join(', ')}`),
        ];
      case JOURNEY_ARCHIVE_PATH:
        return archiveLines(newestFirst);
      case '~/leadership/achievements/README.md':
        return [
          heading('# achievements'),
          ...achievements.map((a) => {
            const note = a.resumeNote !== a.location ? ` (${a.resumeNote})` : '';
            return text(`${a.event.padEnd(24)}${a.award}${note}`);
          }),
        ];
      default:
    }

    if (section === 'projects' && slug && last) {
      const p = project(slug);
      if (!p) return [];
      if (last === 'architecture.txt') {
        return [
          heading('# architecture'),
          ...(p.diagramWide ?? p.diagram).split('\n').map((l) => text(l, 'dir')),
          dim(p.diagramAlt),
        ];
      }
      const lines: Line[] = [
        heading(`# ${p.slug}${p.alias ? ` (${p.alias})` : ''}`),
        text(p.shortSummary),
        text(`stack: ${p.resumeStack.join(', ')}`),
      ];
      if (p.outcome) lines.push(text(`${p.outcome.label}: ${p.outcome.text}`));
      for (const bullet of p.bullets) if (isTodo(bullet)) lines.push(dim(`[${bullet.text}]`));
      return lines;
    }
    if (section === 'experience' && slug && last === 'README.md') {
      const e = job(slug);
      if (!e) return [];
      return [
        heading(`# ${e.title} @ ${e.org}`),
        text(`${formatRange(e.start, e.end, 'arrow')}${e.location ? ` · ${e.location}` : ''}`),
        ...e.bullets.map((b) => text(`- ${b}`)),
        text(`stack: ${e.stack.join(' · ')}`),
      ];
    }
    if (section === 'leadership' && slug === 'achievements' && parts[3] && parts[4]) {
      const a = win(parts[3]);
      if (!a) return [];
      return [
        heading(`# ${a.event}`),
        text(a.award, 'warn'),
        text(a.description),
        ...(a.location ? [dim(`${a.location}${a.year ? ` · ${a.year}` : ''}`)] : []),
      ];
    }
    if (section === 'leadership' && slug && last === 'README.md') {
      const l = role(slug);
      return l ? roleLines(l) : [];
    }
    if (section === 'skills' && slug && last === 'README.md') {
      const s = skills.find((k) => k.slug === slug);
      if (!s) return [];
      const inProjects = projects.filter((p) =>
        [...p.resumeStack, ...p.tags].some((x) => matchesSkill(s.name, x)),
      );
      const inJobs = experience.filter((e) => e.stack.some((x) => matchesSkill(s.name, x)));
      return [
        text(`Package:  ${s.name}`),
        text(`Section:  ${s.group}`),
        text('Status:   install ok installed'),
        ...(inProjects.length
          ? [text(`Projects: ${inProjects.map((p) => p.slug).join(', ')}`)]
          : []),
        ...(inJobs.length ? [text(`Jobs:     ${inJobs.map((e) => e.id).join(', ')}`)] : []),
      ];
    }
    if (section === 'journey' && slug && last === 'README.md') {
      const j = journeyEntries.find((e) => e.slug === slug);
      return j ? journeyLines(j) : [];
    }
    return [];
  };

  const fs: VirtualFs = {};
  for (const node of nodes) {
    if (node.kind === 'dir') {
      const dirNode: FsNode = {
        type: 'dir',
        children: (node.children ?? []).map((c) => c.path.slice(c.path.lastIndexOf('/') + 1)),
      };
      if (node.href) dirNode.route = node.href;
      if (node.cap) dirNode.cap = node.cap;
      fs[node.path] = dirNode;
      continue;
    }
    const fileNode: FsNode = { type: 'file', lines: linesFor(node) };
    if (node.href) {
      fileNode.route = node.href;
      fileNode.own = true;
    } else {
      const route = parentHref.get(node.path);
      if (route) fileNode.route = route;
    }
    fs[node.path] = fileNode;
  }
  return fs;
}
