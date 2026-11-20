import type { SkillGroup } from '@/content/types';

export type SkillSection = 'all' | SkillGroup['key'];

export const SKILL_SECTIONS: readonly SkillSection[] = ['all', 'languages', 'ai-data', 'cloud'];

/** Package counts per section, merged across a group's lists (languages & web is one box). */
export function skillCounts(groups: readonly SkillGroup[]): Record<SkillSection, number> {
  const counts: Record<SkillSection, number> = { all: 0, languages: 0, 'ai-data': 0, cloud: 0 };
  for (const group of groups) {
    const n = group.lists.reduce((sum, list) => sum + list.packages.length, 0);
    counts[group.key] = n;
    counts.all += n;
  }
  return counts;
}

/** Reads `?section=` defensively: anything unknown means "all". */
export function parseSection(search: string): SkillSection {
  const value = new URLSearchParams(search).get('section');
  return SKILL_SECTIONS.find((s) => s === value) ?? 'all';
}

/** The text for the polite live region after a filter change. */
export function filterMessage(section: SkillSection, counts: Record<SkillSection, number>): string {
  return section === 'all'
    ? `Showing all ${counts.all} packages`
    : `Showing ${counts[section]} packages in ${section}`;
}

/** `?section=cloud`, or an empty string for `all`. */
export function sectionQuery(section: SkillSection): string {
  return section === 'all' ? '' : `?section=${section}`;
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Stack spellings that are the same skill under another name (keys are normalized). */
const ALIASES: Readonly<Record<string, readonly string[]>> = {
  apacheairflow: ['airflow'],
  react: ['reactjs'],
  tailwindcss: ['tailwind'],
};

/** Does a project or job stack item (`resumeStack`, a tag, `stack`) refer to this skill? */
export function matchesSkill(skill: string, stackItem: string): boolean {
  const a = norm(skill);
  const b = norm(stackItem);
  return a === b || (ALIASES[a]?.includes(b) ?? false);
}
