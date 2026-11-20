import { achievements } from '@/content/achievements';
import { experience } from '@/content/experience';
import { guide } from '@/content/guide';
import { leadership } from '@/content/leadership';
import { profile } from '@/content/profile';
import { projects } from '@/content/projects';
import { learning, skillGroups } from '@/content/skills';
import { buildVirtualFs, type ShellContent } from '@/lib/shell/fs';
import type { ShellInfo } from '@/lib/shell/types';
import { buildSiteTree } from './site-tree';

/** Everything the site tree and the shell's filesystem are built from. */
export const shellContent: ShellContent = {
  profile,
  experience,
  projects,
  leadership,
  achievements,
  skillGroups,
  learning,
  guide,
};

/** The tree without journey entries (they're read from disk: see `loadSiteTree`). */
export const siteTree = buildSiteTree(shellContent);

export const shellInfo: ShellInfo = {
  email: profile.email,
  github: profile.links.github,
  linkedin: profile.links.linkedin,
};

export const buildSiteFs = (journeyEntries: Parameters<typeof buildVirtualFs>[1] = []) =>
  buildVirtualFs(shellContent, journeyEntries);
