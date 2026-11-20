/** A placeholder for content Kushal still has to supply. Views render it dim, in brackets. */
export type Todo = { readonly kind: 'todo'; readonly text: string };

export const todo = (text: string): Todo => ({ kind: 'todo', text }) as const;

export const isTodo = (value: unknown): value is Todo =>
  typeof value === 'object' &&
  value !== null &&
  (value as { kind?: unknown }).kind === 'todo' &&
  typeof (value as { text?: unknown }).text === 'string';

export type MaybeTodo = string | Todo;

/** `YYYY-MM`, or `'present'` for an end date that is still open. */
export type YearMonth = string;
export type EndDate = YearMonth | 'present';

export type Link = { href: string; label: string; handle: string };

/** Inline copy with optional styling, so views never need markup inside content strings. */
export type Inline = string | { text: string; tone?: 'green' | 'fg'; href?: string };

export type NeofetchRef = 'name' | 'role' | 'location' | 'email' | 'uptime';
export type NeofetchRow = { label: string; value: string | { ref: NeofetchRef } };

export type Profile = {
  name: string;
  shortName: string;
  role: string;
  tagline: string;
  oneLiner: string;
  resumeHeadline: string;
  resumeSummary: string;
  location: string;
  timezone: string;
  openTo: readonly string[];
  email: string;
  links: { github: Link; linkedin: Link };
  resume: { href: string; label: string };
  manPage: { title: string; section: number; date: string };
  education: {
    school: string;
    degree: string;
    degreeShort: string;
    emphasis: string;
    emphasisShort: string;
    start: string;
    end: string;
    gpa: number;
  };
  about: { paragraphs: readonly string[]; short: readonly string[] };
  neofetch: readonly NeofetchRow[];
  synopsisFlags: readonly string[];
};

export type Experience = {
  id: string;
  commit: string;
  title: string;
  titleNote?: string;
  org: string;
  orgShort?: string;
  start: YearMonth;
  end: EndDate;
  location?: string;
  workMode?: 'Hybrid' | 'Remote';
  bullets: readonly string[];
  summary: string;
  /** Only set when the resume's wording genuinely differs from `bullets`. */
  resumeBullets?: readonly string[];
  stack: readonly string[];
};

export type Project = {
  slug: string;
  name: string;
  alias?: string;
  badge: string;
  badgeTone: 'highlight' | 'dim';
  featured: boolean;
  tags: readonly string[];
  summary: string;
  shortSummary: string;
  resumeSummary?: string;
  diagram: string;
  diagramWide?: string;
  diagramAlt: string;
  bullets: readonly MaybeTodo[];
  links: { source?: string; devpost?: string };
  outcome?: { label: 'result' | 'status'; text: string };
  resumeStack: readonly string[];
  onResume: boolean;
  team?: { size: number };
};

export type ExtraProject = {
  name: string;
  stack: readonly string[];
  /** The achievement that documents it (and holds its Devpost link). */
  achievementId: string;
};

export type ImpactItem = MaybeTodo;

export type LeadershipRole = {
  pid: string;
  role: string;
  org: string;
  scope: string;
  stat: 'R' | 'Z';
  status: { text: string; tone: 'running' | 'exited' };
  summary?: string;
  impact?: readonly ImpactItem[];
  /** The trailing note on the plain-text resume. */
  resumeNote: string;
};

export type Achievement = {
  id: string;
  event: string;
  award: string;
  description: string;
  year?: number;
  location?: string;
  link?: string;
  project?: string;
  /** The Leadership page appends `, {location}` to the description for some rows. */
  inlineVenue: boolean;
  /** Short label on the plain-text resume. */
  resumeNote: string;
  /** The `git log --oneline` entry on the dashboard. */
  logEntry: { name: string; award: string; venue: string };
};

export type SkillList = {
  key: 'languages' | 'web' | 'ai-data' | 'cloud';
  /** Short flag on the man page, e.g. `l` for `-l, --languages`. */
  flag: string;
  resumeLabel: string;
  packages: readonly string[];
};

export type SkillGroup = {
  key: 'languages' | 'ai-data' | 'cloud';
  title: string;
  lists: readonly SkillList[];
  alsoUsed: readonly string[];
};

export type Learning = { name: string; shortName: string; note: string };

export type GuideItem = {
  what: string;
  cmd: string;
  hint: string;
  kind: 'command' | 'key';
  /** Static output, only for non-command items. Phase 5 generates the rest from the shell. */
  output?: string;
};

export type Guide = {
  title: string;
  subtitle: string;
  intro: readonly (readonly Inline[])[];
  quickStart: { title: string; steps: readonly (readonly Inline[])[] };
  sections: readonly { title: string; items: readonly GuideItem[] }[];
  concepts: readonly { title: string; body: readonly Inline[] }[];
  footnote: string;
};
