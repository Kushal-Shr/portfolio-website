import type {
  Achievement,
  Experience,
  LeadershipRole,
  Learning,
  Profile,
  Project,
  SkillGroup,
} from '@/content/types';
import { isTodo } from '@/content/types';
import { formatRange } from '@/lib/format';
import { renderResume } from '@/lib/resume';
import { link, seg, text } from './lines';
import type { FsNode, JourneyEntry, Line, VirtualFs } from './types';

export type ShellContent = {
  profile: Profile;
  experience: readonly Experience[];
  projects: readonly Project[];
  leadership: readonly LeadershipRole[];
  achievements: readonly Achievement[];
  skillGroups: readonly SkillGroup[];
  learning: readonly Learning[];
};

/** Plain text lines; a leading `# ` or `──` heading is yellow, `#` headings bold too. */
function doc(lines: string[]): Line[] {
  return lines.map((value, i) =>
    i === 0 && /^#|^──/.test(value) ? text(value, 'warn', value.startsWith('#')) : text(value),
  );
}

const dim = (value: string): Line => text(value, 'dim');

/**
 * Builds the virtual filesystem from content. Nothing here is typed by hand: every fact comes
 * from `content/`, so the shell can never drift from the pages.
 */
export function buildVirtualFs(
  content: ShellContent,
  journeyEntries: readonly JourneyEntry[] = [],
): VirtualFs {
  const { profile, experience, projects, leadership, achievements, skillGroups, learning } =
    content;
  const fs: VirtualFs = {};
  const dir = (path: string, children: string[], route?: string) => {
    const node: FsNode = { type: 'dir', children };
    if (route) node.route = route;
    fs[path] = node;
  };
  const file = (path: string, lines: Line[], route?: string) => {
    const node: FsNode = { type: 'file', lines };
    if (route) node.route = route;
    fs[path] = node;
  };

  const impactRoles = leadership.filter((l) => l.impact);
  dir('~', [
    'dashboard',
    'about.md',
    'projects',
    'experience.log',
    'leadership',
    'skills.txt',
    'resume.txt',
    'journey',
  ]);

  dir('~/dashboard', ['index.tui'], '/dashboard/');
  file(
    '~/dashboard/index.tui',
    doc(['cat: index.tui: binary file — it is a full-screen app', 'try: open dashboard']),
    '/dashboard/',
  );

  file('~/about.md', doc(['# about', ...profile.about.short]), '/about/');

  dir(
    '~/projects',
    projects.map((p) => `${p.slug}.md`),
    '/projects/',
  );
  for (const p of projects) {
    const lines: Line[] = [
      text(`# ${p.slug}${p.alias ? ` (${p.alias})` : ''}`, 'warn', true),
      text(p.shortSummary),
      text(`stack: ${p.resumeStack.join(', ')}`),
    ];
    if (p.outcome) lines.push(text(`${p.outcome.label}: ${p.outcome.text}`));
    for (const bullet of p.bullets) if (isTodo(bullet)) lines.push(dim(`[${bullet.text}]`));
    file(`~/projects/${p.slug}.md`, lines, `/projects/#${p.slug}`);
  }

  const gap = ' '.repeat(19);
  file(
    '~/experience.log',
    experience.flatMap((e) => [
      text(`${formatRange(e.start, e.end, 'arrow')}  ${e.title} @ ${e.orgShort ?? e.org}`),
      text(`${gap}- ${e.summary}`),
    ]),
    '/experience/',
  );

  const roleFile = (l: LeadershipRole) => `${l.role.toLowerCase()}.md`;
  dir('~/leadership', [...impactRoles.map(roleFile), 'achievements.md'], '/leadership/');
  for (const l of impactRoles) {
    const lines: Line[] = [text(`# ${l.role} · ${l.org}`, 'warn', true)];
    if (l.summary) lines.push(text(l.summary));
    for (const item of l.impact ?? []) {
      lines.push(isTodo(item) ? dim(`[${item.text}]`) : text(`- ${item}`));
    }
    file(`~/leadership/${roleFile(l)}`, lines, '/leadership/');
  }
  file(
    '~/leadership/achievements.md',
    [
      text('# achievements', 'warn', true),
      ...achievements.map((a) => {
        const note = a.resumeNote !== a.location ? ` (${a.resumeNote})` : '';
        return text(`${a.event.padEnd(24)}${a.award}${note}`);
      }),
    ],
    '/leadership/',
  );

  const lists = skillGroups.flatMap((g) => g.lists);
  file(
    '~/skills.txt',
    [
      ...lists.map((l) => text(`${l.key.padEnd(13)}${l.packages.join(', ')}`)),
      text(`${'learning'.padEnd(13)}${learning.map((l) => l.shortName).join(', ')}`),
    ],
    '/skills/',
  );

  const tone = { rule: 'dim', heading: 'warn', dim: 'dim' } as const;
  file(
    '~/resume.txt',
    [
      ...renderResume({ profile, experience, projects, leadership, achievements, skillGroups }).map(
        (line): Line => ({
          kind: 'text',
          segments: line.map((s) => seg(s.text, s.tone ? tone[s.tone] : undefined, s.bold)),
        }),
      ),
      link('↗ ', 'wget resume.pdf', profile.resume.href),
    ],
    '/resume/',
  );

  dir(
    '~/journey',
    journeyEntries.map((e) => e.name),
    '/journey/',
  );
  for (const entry of journeyEntries) file(`~/journey/${entry.name}`, entry.lines, '/journey/');

  return fs;
}
