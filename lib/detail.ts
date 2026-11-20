import type { Experience, Project } from '@/content/types';
import { experience } from '@/content/experience';
import { projects } from '@/content/projects';
import { skillGroups } from '@/content/skills';
import {
  findByPath,
  pageSiblings,
  parentOf,
  skillEntries,
  type SiteNode,
  type SkillEntry,
} from './site-tree';
import { matchesSkill } from './skills';

const allSkills = skillEntries(skillGroups);

/** The skill page a stack name belongs to, if there is one. */
export function skillFor(stackName: string): SkillEntry | undefined {
  return allSkills.find((s) => matchesSkill(s.name, stackName));
}

/** Projects and jobs that use a skill (stack lists and tags, matched through `matchesSkill`). */
export function usageOf(skill: SkillEntry): { projects: Project[]; jobs: Experience[] } {
  return {
    projects: projects.filter((p) =>
      [...p.resumeStack, ...p.tags].some((item) => matchesSkill(skill.name, item)),
    ),
    jobs: experience.filter((e) => e.stack.some((item) => matchesSkill(skill.name, item))),
  };
}

export type TrailLink = { href: string; label: string };
export type Trail = { up?: TrailLink; prev?: TrailLink; next?: TrailLink; section: string };

/** `cd ..` and the previous and next sibling pages, in content order. */
export function trailFor(tree: SiteNode, path: string): Trail {
  const node = findByPath(tree, path);
  if (!node) return { section: '' };
  const parent = parentOf(tree, node);
  let siblings = pageSiblings(tree, node);
  // Skill pages page through their own box only.
  if (node.group) siblings = siblings.filter((s) => s.group === node.group);
  // Journey entries page through each other in date order (‹ older, newer ›), not the archive.
  if (node.section === 'journey') {
    siblings = siblings
      .filter((s) => s.kind === 'dir')
      .sort((a, b) => a.path.localeCompare(b.path));
  }
  const i = siblings.indexOf(node);
  const link = (n: SiteNode | undefined): TrailLink | undefined =>
    n?.href ? { href: n.href, label: n.title } : undefined;
  return {
    section: parent?.title ?? '',
    up: link(parent),
    prev: i > 0 ? link(siblings[i - 1]) : undefined,
    next: i >= 0 ? link(siblings[i + 1]) : undefined,
  };
}
