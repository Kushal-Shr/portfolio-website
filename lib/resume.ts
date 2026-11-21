import type {
  Achievement,
  Experience,
  LeadershipRole,
  Profile,
  Project,
  SkillGroup,
} from '@/content/types';
import { formatRange } from './format';

export const RESUME_WIDTH = 78;

export type Segment = {
  text: string;
  tone?: 'rule' | 'heading' | 'dim';
  bold?: boolean;
  /** Font size in px for the name line. */
  size?: number;
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
  /** `YYYY-MM-DD`. When given, the closing line shows it instead of the design's note. */
  built?: string;
};

const blank: ResumeLine = [{ text: '' }];
const rule = (char: '=' | '-'): ResumeLine => [{ text: char.repeat(RESUME_WIDTH), tone: 'rule' }];
const heading = (text: string): ResumeLine[] => [
  blank,
  [{ text, tone: 'heading', bold: true }],
  rule('-'),
];

/** Greedy word wrap: `first` prefixes the first line, `rest` every continuation line. */
function wrap(text: string, first: string, rest: string): string[] {
  const lines: string[] = [];
  let line = first;
  let empty = true;
  for (const word of text.split(' ')) {
    const candidate = empty ? line + word : `${line} ${word}`;
    if (!empty && candidate.length > RESUME_WIDTH) {
      lines.push(line);
      line = rest + word;
    } else {
      line = candidate;
    }
    empty = false;
  }
  lines.push(line);
  return lines;
}

/** A bold lead-in, then text, then `right` flush against column 78. */
function row(lead: string, text: string, right: string): ResumeLine {
  const gap = Math.max(1, RESUME_WIDTH - lead.length - text.length - right.length);
  return [{ text: lead, bold: true }, { text: text + ' '.repeat(gap) + right }];
}

const sentence = (s: string): string => (/[.!?]$/.test(s) ? s : `${s}.`);

/** Builds the plain-text resume as styled lines, 78 columns wide at most. */
export function renderResume(c: ResumeContent): ResumeLine[] {
  const { profile } = c;
  const lines: ResumeLine[] = [
    rule('='),
    [{ text: profile.name, bold: true, size: 22 }],
    [{ text: profile.resumeHeadline }],
    [{ text: `${profile.email} · ${profile.links.github.label}` }],
    [{ text: profile.links.linkedin.label }],
    rule('='),
    ...heading('SUMMARY'),
    ...wrap(profile.resumeSummary, '', '').map((text): ResumeLine => [{ text }]),
    ...heading('EXPERIENCE'),
  ];

  for (const e of c.experience) {
    const org = e.workMode === 'Remote' ? `${e.org} (remote)` : e.org;
    lines.push(row(`${e.title}, `, org, formatRange(e.start, e.end, 'dash')));
    for (const bullet of e.resumeBullets ?? e.bullets) {
      for (const text of wrap(sentence(bullet), '  - ', '    ')) lines.push([{ text }]);
    }
  }

  lines.push(...heading('PROJECTS'));
  for (const p of c.projects.filter((p) => p.onResume)) {
    lines.push([{ text: p.name, bold: true }, { text: `  ${p.resumeStack.join(', ')}` }]);
    for (const text of wrap(p.resumeSummary ?? p.shortSummary, '  ', '  ')) lines.push([{ text }]);
  }

  lines.push(...heading('LEADERSHIP'));
  for (const l of c.leadership.filter((l) => l.resumeNote)) {
    lines.push(row(`${l.role}, `, l.org, l.resumeNote));
  }

  lines.push(...heading('COMPETITIONS'));
  for (const a of c.achievements) lines.push(row(`${a.event}, `, a.award, a.resumeNote));

  const edu = profile.education;
  lines.push(
    ...heading('EDUCATION'),
    row(
      `${edu.school}, `,
      `${edu.degreeShort} (${edu.emphasisShort} emphasis)`,
      `${edu.start} – ${edu.end}`,
    ),
    [{ text: `  GPA ${edu.gpa.toFixed(2)}` }],
    ...heading('SKILLS'),
  );
  const LABEL = 14;
  for (const list of c.skillGroups.flatMap((g) => g.lists)) {
    const wrapped = wrap(
      list.packages.join(', '),
      list.resumeLabel.padEnd(LABEL),
      ' '.repeat(LABEL),
    );
    for (const text of wrapped) lines.push([{ text }]);
  }

  lines.push(
    rule('='),
    c.built
      ? [
          { text: '-- EOF --  (built ', tone: 'dim' },
          { text: c.built, tone: 'dim', buildDate: true },
          { text: ')', tone: 'dim' },
        ]
      : [{ text: `-- EOF --  (${RESUME_WIDTH} columns, prints cleanly on one page)`, tone: 'dim' }],
  );
  return lines;
}

export const lineText = (line: ResumeLine): string => line.map((s) => s.text).join('');
