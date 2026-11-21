import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { leadership } from '@/content/leadership';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import type { Achievement, Experience, LeadershipRole, Project } from '@/content/types';
import { formatRange, openToSentence } from '@/lib/format';
import { usageOf } from '@/lib/detail';
import type { SkillEntry } from '@/lib/site-tree';

/** Search results cut descriptions off at about this length. */
export const MAX_DESCRIPTION = 155;

/** Cuts `text` to `max` characters at a word boundary, ending in an ellipsis when it had to cut. */
export function clip(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max - 1);
  const space = head.lastIndexOf(' ');
  const cut = space > max * 0.6 ? head.slice(0, space) : head;
  return `${cut.replace(/[\s,;:.\-–—]+$/, '')}…`;
}

const city = profile.location.split(',')[0] ?? profile.location;
const list = (items: readonly string[]): string =>
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

export const defaultTitle = `${profile.name} · CS student building data & AI products`;

export const siteDescription = clip(
  `${profile.name}: CS student at ${profile.education.school} in ${city} building data pipelines and AI products. Open to ${openToSentence(profile.openTo)} roles.`,
);

const projectNames = (items: readonly Project[]): string =>
  list(
    items.map((p) => {
      const win = p.badgeTone === 'highlight' ? ` (${p.badge.replace(' · ', ', ')})` : '';
      return `${p.name}${win}`;
    }),
  );

/** One description per fixed route, written for a recruiter scanning search results. */
export const routeDescriptions = {
  dashboard: clip(
    `A one-screen overview of ${profile.name}: ${projects.length} projects, ${experience.length} jobs and internships, skills and contact links, laid out as a terminal dashboard.`,
  ),
  about: clip(`${profile.name}: ${profile.about.short[0] ?? ''} ${profile.about.short[2] ?? ''}`),
  projects: clip(`${projectNames(projects)}. Built by ${profile.name}.`),
  experience: clip(
    `Work history of ${profile.name}: ${list(experience.map((e) => `${e.title} at ${e.orgShort ?? e.org}`))}.`,
  ),
  leadership: clip(
    `Leadership and competition wins of ${profile.name}: ${list(
      leadership.filter((l) => l.summary).map((l) => `${l.role}, ${l.org}`),
    )}, plus ${achievements.length} wins at hackathons and coding contests.`,
  ),
  achievements: clip(
    `Competitions ${profile.name} has won: ${list(achievements.map((a) => `${a.event} (${a.award})`))}.`,
  ),
  skills: clip(
    `Languages, web, AI & data and cloud tools ${profile.name} has used, such as ${list(
      skillGroups.flatMap((g) => g.lists.flatMap((l) => l.packages)).slice(0, 5),
    )}.`,
  ),
  resume: clip(
    `Resume of ${profile.name} as plain text, with a PDF download. ${profile.resumeHeadline}.`,
  ),
  journey: `A daily log of what ${profile.name} learned, built and got stuck on, one entry per day.`,
  archive: `Every entry in the daily journey log of ${profile.name}, one line each.`,
  guide: clip(
    `How to use this terminal-style portfolio of ${profile.name}: commands, Tab completion and navigation, with examples that run.`,
  ),
} as const;

export function projectMeta(p: Project): { description: string; keywords: string[] } {
  return {
    description: clip(`${p.name}: ${p.shortSummary}`),
    keywords: [...new Set([...p.resumeStack, ...p.tags].map((k) => k.toLowerCase()))],
  };
}

export function jobMeta(job: Experience): {
  title: string;
  description: string;
  keywords: string[];
} {
  const range = formatRange(job.start, job.end, 'years');
  const first = (job.bullets[0] ?? job.summary).replace(/[.\s]+$/, '');
  return {
    title: `${job.title} @ ${job.orgShort ?? job.org} (${range})`,
    description: clip(`${first}. ${job.title} at ${job.org}, ${range}.`),
    keywords: [...job.stack],
  };
}

export function roleMeta(l: LeadershipRole): { title: string; description: string } {
  const scope = l.scope ? ` (${l.scope})` : '';
  return {
    title: `${l.role} · ${l.org}`,
    description: clip(`${l.role}, ${l.org}${scope}. ${l.summary ?? ''}`),
  };
}

export function achievementMeta(a: Achievement): { title: string; description: string } {
  const where = a.location ? `, ${a.location}` : '';
  const when = a.year ? ` (${a.year})` : '';
  return {
    title: `${a.award} · ${a.event}`,
    description: clip(`${a.award} at ${a.event}${where}${when}. ${a.description}`),
  };
}

export function skillMeta(skill: SkillEntry): { description: string } {
  const { projects: ps, jobs } = usageOf(skill);
  const where = [
    ...ps.map((p) => p.name),
    ...jobs.map((j) => `${j.title} @ ${j.orgShort ?? j.org}`),
  ];
  return {
    description: clip(
      where.length
        ? `${skill.name}: where ${profile.name} has used it — ${where.join(', ')}`
        : `${skill.name}: one of the tools on the skills list of ${profile.name}.`,
    ),
  };
}
