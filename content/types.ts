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
  location: string;
  timezone: string;
  openTo: readonly string[];
  email: string;
  links: { github: Link; linkedin: Link };
  resume: { href: string; label: string };
  manPage: { title: string; section: number };
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
  /** The title as the PDF resume prints it, when it differs from `title`. */
  resumeTitle?: string;
  /** The PDF resume's bullets, word for word (the site's `bullets` are shorter and plainer). */
  resumeBullets: readonly string[];
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
  /** The name as the PDF resume prints it, when it differs from `name`. */
  resumeName?: string;
  /** The PDF resume's bullets, word for word. Only for `onResume` projects. */
  resumeBullets?: readonly string[];
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
  slug: string;
  pid: string;
  role: string;
  org: string;
  scope: string;
  stat: 'R' | 'Z';
  status: { text: string; tone: 'running' | 'exited' };
  summary?: string;
  impact?: readonly ImpactItem[];
  /** The line on the PDF resume. Roles the PDF folds into another one have none. */
  resumeLine?: { title: string; org: string };
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
  /** Short label in the shell's achievements README. */
  resumeNote: string;
  /** The PDF resume's wording: an inline note after the award, or a bullet underneath. */
  resume: { inline?: string; bullet?: string };
  /** The `git log --oneline` entry on the dashboard. */
  logEntry: { name: string; award: string; venue: string };
};

export type SkillList = {
  key: 'languages' | 'web' | 'ai-data' | 'cloud';
  /** Short flag on the man page, e.g. `l` for `-l, --languages`. */
  flag: string;
  packages: readonly string[];
};

export type SkillGroup = {
  key: 'languages' | 'ai-data' | 'cloud';
  title: string;
  /** The group's label on the PDF resume. */
  resumeLabel: string;
  lists: readonly SkillList[];
  alsoUsed: readonly string[];
};

/** A project Kushal is building right now (slug from `content/projects.ts`), with a short note. */
export type NowBuilding = { project: string; note: string };

export type GuideItem = {
  what: string;
  cmd: string;
  hint: string;
  kind: 'command' | 'key';
  /** Static output, only for items the shell can't run (like the arrow keys). */
  output?: string;
  /** Commands run first so the example has context (e.g. `cd projects` before `cd ..`). */
  setup?: readonly string[];
  /** Run this instead of `cmd` to produce the output (the `clear` item shows `history`). */
  show?: string;
  /** Body lines to keep before truncating with `…` (default 4). */
  maxLines?: number;
  /** The output is the Tab completion of `cmd`, computed by the shell. */
  complete?: boolean;
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
