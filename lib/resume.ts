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

/**
 * The phone layout: 42 columns fill a 390px screen at 13px, and still fit a 320px one when the
 * page shrinks the type to the screen's width.
 */
export const RESUME_PHONE_WIDTH = 42;

/** Column count, plus the name's size and the body size it is centred against (both px). */
export type ResumeLayout = { width: number; nameSize: number; baseSize: number };

const DESKTOP: ResumeLayout = { width: RESUME_WIDTH, nameSize: 22, baseSize: 15 };
export const PHONE_LAYOUT: ResumeLayout = { width: RESUME_PHONE_WIDTH, nameSize: 20, baseSize: 13 };

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
 * bullet's second line sits under its first word. A `|` separator stays on the line of the word
 * before it, so no line starts with one.
 */
function flow(segments: readonly Segment[], cols: number, indent = ''): ResumeLine[] {
  const parts = segments.flatMap((s) =>
    s.text
      .split(/( +)/)
      .filter(Boolean)
      .map((text) => ({ ...s, text })),
  );
  // Units that never break inside: a word, or a word with its trailing ` |`.
  const units: Segment[][] = [];
  let gap: Segment[] = [];
  for (const part of parts) {
    if (part.text.startsWith(' ')) gap.push(part);
    else if (part.text === '|' && units.length > 0) units[units.length - 1]?.push(...gap, part);
    else units.push([...gap, part]);
    if (!part.text.startsWith(' ')) gap = [];
  }
  const lines: Segment[][] = [];
  let line: Segment[] = [];
  for (const unit of units) {
    const lead = unit.findIndex((s) => !s.text.startsWith(' '));
    if (line.length > 0 && width(line) + width(unit) > cols) {
      lines.push(line);
      line = [{ text: indent }, ...unit.slice(lead)];
    } else {
      line.push(...unit);
    }
  }
  lines.push(line);
  return lines.map(merge);
}

/** `left` with `right` flush against the last column; on its own lines when they don't fit. */
function row(left: readonly Segment[], right: readonly Segment[], cols: number): ResumeLine[] {
  if (width(right) === 0) return flow(left, cols);
  const gap = cols - width(left) - width(right);
  if (gap >= 1) return [merge([...left, { text: ' '.repeat(gap) }, ...right])];
  return [
    ...flow(left, cols),
    ...flow(right, cols).map((line) =>
      merge([{ text: ' '.repeat(Math.max(0, cols - width(line))) }, ...line]),
    ),
  ];
}

/** Each wrapped line centred on its own. */
const center = (segments: readonly Segment[], cols: number): ResumeLine[] =>
  flow(segments, cols).map((line) =>
    merge([{ text: ' '.repeat(Math.max(0, Math.floor((cols - width(line)) / 2))) }, ...line]),
  );

const bar: Segment = { text: ' | ' };

/**
 * The PDF resume as styled plain-text lines, in its order and words, `layout.width` columns wide.
 * The phone number stays out.
 */
export function renderResume(c: ResumeContent, layout: ResumeLayout = DESKTOP): ResumeLine[] {
  const { profile } = c;
  const edu = profile.education;
  const { width: cols, nameSize, baseSize } = layout;
  const rule = (char: '=' | '-'): ResumeLine => [{ text: char.repeat(cols), tone: 'rule' }];
  const heading = (text: string): ResumeLine[] => [
    blank,
    [{ text, tone: 'heading', bold: true }],
    rule('-'),
  ];
  const bullet = (text: string): ResumeLine[] => flow([{ text: `  • ${text}` }], cols, '    ');
  const lines: ResumeLine[] = [
    rule('='),
    // The name is drawn larger, so centering it by its character count would push it right.
    merge([
      {
        text: ' '.repeat(
          Math.max(0, Math.floor((cols - (profile.name.length * nameSize) / baseSize) / 2)),
        ),
      },
      { text: profile.name, bold: true, size: nameSize },
    ]),
    ...center(
      [
        { text: profile.email, href: `mailto:${profile.email}` },
        bar,
        { text: 'LinkedIn', href: profile.links.linkedin.href },
        bar,
        { text: 'GitHub', href: profile.links.github.href },
        bar,
        { text: profile.location },
      ],
      cols,
    ),
    rule('='),
    ...heading('EDUCATION'),
    ...row([{ text: edu.school, bold: true }], [{ text: profile.location }], cols),
    ...row(
      [{ text: `${edu.degree} - Emphasis in ${edu.emphasis}`, tone: 'dim' }],
      [{ text: `GPA: ${edu.gpa.toFixed(2)} | ${edu.start} - ${edu.end}`, tone: 'dim' }],
      cols,
    ),
    ...heading('EXPERIENCE'),
  ];

  for (const e of c.experience) {
    lines.push(
      ...row(
        [{ text: e.resumeTitle ?? e.title, bold: true }],
        [{ text: formatRange(e.start, e.end, 'long') }],
        cols,
      ),
      ...row(
        [{ text: e.org, tone: 'dim' }],
        [{ text: [e.workMode, e.location].filter(Boolean).join(' | '), tone: 'dim' }],
        cols,
      ),
    );
    for (const b of e.resumeBullets) lines.push(...bullet(b));
  }

  lines.push(...heading('PROJECTS'));
  for (const p of c.projects.filter((p) => p.onResume)) {
    lines.push(
      ...flow(
        [
          { text: p.resumeName ?? p.name, bold: true },
          bar,
          { text: p.resumeStack.join(', '), tone: 'dim' },
          ...(p.links.source ? [bar, { text: 'Source Code', href: p.links.source }] : []),
        ],
        cols,
      ),
    );
    for (const b of p.resumeBullets ?? []) lines.push(...bullet(b));
  }

  lines.push(...heading('LEADERSHIP & ACHIEVEMENTS'));
  for (const l of c.leadership) {
    if (l.resumeLine) {
      lines.push(
        ...flow(
          [{ text: l.resumeLine.title, bold: true }, bar, { text: l.resumeLine.org, tone: 'dim' }],
          cols,
        ),
      );
    }
  }

  lines.push(...heading('TECHNICAL SKILLS'));
  for (const g of c.skillGroups) {
    const packages = g.lists.flatMap((l) => l.packages).join(', ');
    lines.push(
      ...flow([{ text: g.resumeLabel, bold: true }, { text: `: ${packages}.` }], cols, '  '),
    );
  }

  lines.push(...heading('COMPETITIONS'));
  for (const a of c.achievements) {
    const left: Segment[] = [{ text: a.event, bold: true }, bar, { text: a.award, tone: 'dim' }];
    if (a.link) left.push(bar, { text: 'Project Link', href: a.link });
    if (a.resume.inline) left.push(bar, { text: a.resume.inline });
    lines.push(...row(left, a.location ? [{ text: a.location }] : [], cols));
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
