import type {
  Achievement,
  Experience,
  LeadershipRole,
  Profile,
  Project,
  SkillGroup,
} from '@/content/types';
import { formatRange } from './format';

/** Wide enough that most of the PDF's lines fit on one row, narrow enough to print on one page. */
export const RESUME_WIDTH = 112;

export type Segment = {
  text: string;
  tone?: 'rule' | 'heading' | 'dim';
  bold?: boolean;
  /** Font size in px for the name line. */
  size?: number;
  /** Renders as a link, like the underlined links in the PDF. */
  href?: string;
  /** Marks the build date, which changes on every build (visual tests mask it). */
  buildDate?: boolean;
};
export type ResumeLine = Segment[];

export type ResumeContent = {
  profile: Profile;
  experience: readonly Experience[];
  projects: readonly Project[];
  leadership: readonly LeadershipRole[];
  achievements: readonly Achievement[];
  skillGroups: readonly SkillGroup[];
  /** `YYYY-MM-DD`. When given, the closing line shows it. */
  built?: string;
};

const blank: ResumeLine = [{ text: '' }];
const rule = (char: '=' | '-'): ResumeLine => [{ text: char.repeat(RESUME_WIDTH), tone: 'rule' }];
const heading = (text: string): ResumeLine[] => [
  blank,
  [{ text, tone: 'heading', bold: true }],
  rule('-'),
];

const width = (segments: readonly Segment[]): number =>
  segments.reduce((n, s) => n + [...s.text].length, 0);

const sameStyle = (a: Segment, b: Segment): boolean =>
  a.tone === b.tone && a.bold === b.bold && a.href === b.href && a.size === b.size;

/** Joins neighbouring segments that look the same, so a wrapped line stays a few spans. */
function merge(segments: readonly Segment[]): ResumeLine {
  const out: ResumeLine = [];
  for (const s of segments) {
    const prev = out[out.length - 1];
    if (prev && sameStyle(prev, s)) out[out.length - 1] = { ...prev, text: prev.text + s.text };
    else if (s.text) out.push({ ...s });
  }
  return out;
}

/**
 * Greedy word wrap that keeps each word's style. Continuation lines start with `indent`, so a
 * bullet's second line sits under its first word.
 */
function flow(segments: readonly Segment[], indent = ''): ResumeLine[] {
  const words = segments.flatMap((s) =>
    s.text
      .split(/( +)/)
      .filter(Boolean)
      .map((text) => ({ ...s, text })),
  );
  const lines: Segment[][] = [];
  let line: Segment[] = [];
  let pending: Segment[] = [];
  for (const word of words) {
    if (word.text.startsWith(' ')) {
      pending.push(word);
      continue;
    }
    if (line.length > 0 && width(line) + width(pending) + width([word]) > RESUME_WIDTH) {
      lines.push(line);
      line = [{ text: indent }];
      pending = [];
    }
    line.push(...pending, word);
    pending = [];
  }
  lines.push(line);
  return lines.map(merge);
}

/** `left` with `right` flush against the last column; on its own line when they don't fit. */
function row(left: readonly Segment[], right: readonly Segment[]): ResumeLine[] {
  const gap = RESUME_WIDTH - width(left) - width(right);
  if (gap >= 1) return [merge([...left, { text: ' '.repeat(gap) }, ...right])];
  return [
    ...flow(left),
    merge([{ text: ' '.repeat(Math.max(0, RESUME_WIDTH - width(right))) }, ...right]),
  ];
}

const center = (segments: readonly Segment[]): ResumeLine =>
  merge([
    { text: ' '.repeat(Math.max(0, Math.floor((RESUME_WIDTH - width(segments)) / 2))) },
    ...segments,
  ]);

const bullet = (text: string): ResumeLine[] => flow([{ text: `  • ${text}` }], '    ');
const bar: Segment = { text: ' | ' };

/** The PDF resume as styled plain-text lines, in its order and words. The phone number stays out. */
export function renderResume(c: ResumeContent): ResumeLine[] {
  const { profile } = c;
  const edu = profile.education;
  const nameSize = 22;
  const lines: ResumeLine[] = [
    rule('='),
    // The name is drawn larger, so centering it by its character count would push it right.
    merge([
      { text: ' '.repeat(Math.floor((RESUME_WIDTH - (profile.name.length * nameSize) / 15) / 2)) },
      { text: profile.name, bold: true, size: nameSize },
    ]),
    center([
      { text: profile.email, href: `mailto:${profile.email}` },
      bar,
      { text: 'LinkedIn', href: profile.links.linkedin.href },
      bar,
      { text: 'GitHub', href: profile.links.github.href },
      bar,
      { text: profile.location },
    ]),
    rule('='),
    ...heading('EDUCATION'),
    ...row([{ text: edu.school, bold: true }], [{ text: profile.location }]),
    ...row(
      [{ text: `${edu.degree} - Emphasis in ${edu.emphasis}`, tone: 'dim' }],
      [{ text: `GPA: ${edu.gpa.toFixed(2)} | ${edu.start} - ${edu.end}`, tone: 'dim' }],
    ),
    ...heading('EXPERIENCE'),
  ];

  for (const e of c.experience) {
    lines.push(
      ...row(
        [{ text: e.resumeTitle ?? e.title, bold: true }],
        [{ text: formatRange(e.start, e.end, 'long') }],
      ),
      ...row(
        [{ text: e.org, tone: 'dim' }],
        [{ text: [e.workMode, e.location].filter(Boolean).join(' | '), tone: 'dim' }],
      ),
    );
    for (const b of e.resumeBullets) lines.push(...bullet(b));
  }

  lines.push(...heading('PROJECTS'));
  for (const p of c.projects.filter((p) => p.onResume)) {
    lines.push(
      ...flow([
        { text: p.resumeName ?? p.name, bold: true },
        bar,
        { text: p.resumeStack.join(', '), tone: 'dim' },
        ...(p.links.source ? [bar, { text: 'Source Code', href: p.links.source }] : []),
      ]),
    );
    for (const b of p.resumeBullets ?? []) lines.push(...bullet(b));
  }

  lines.push(...heading('LEADERSHIP & ACHIEVEMENTS'));
  for (const l of c.leadership) {
    if (l.resumeLine) {
      lines.push(
        ...flow([
          { text: l.resumeLine.title, bold: true },
          bar,
          { text: l.resumeLine.org, tone: 'dim' },
        ]),
      );
    }
  }

  lines.push(...heading('TECHNICAL SKILLS'));
  for (const g of c.skillGroups) {
    const packages = g.lists.flatMap((l) => l.packages).join(', ');
    lines.push(...flow([{ text: g.resumeLabel, bold: true }, { text: `: ${packages}.` }], '  '));
  }

  lines.push(...heading('COMPETITIONS'));
  for (const a of c.achievements) {
    const left: Segment[] = [{ text: a.event, bold: true }, bar, { text: a.award, tone: 'dim' }];
    if (a.link) left.push(bar, { text: 'Project Link', href: a.link });
    if (a.resume.inline) left.push(bar, { text: a.resume.inline });
    lines.push(...row(left, [{ text: a.location ?? '' }]));
    if (a.resume.bullet) lines.push(...bullet(a.resume.bullet));
  }

  lines.push(
    blank,
    rule('='),
    c.built
      ? [
          { text: '-- EOF --  (built ', tone: 'dim' },
          { text: c.built, tone: 'dim', buildDate: true },
          { text: ')', tone: 'dim' },
        ]
      : [{ text: '-- EOF --', tone: 'dim' }],
  );
  return lines;
}

export const lineText = (line: ResumeLine): string => line.map((s) => s.text).join('');
