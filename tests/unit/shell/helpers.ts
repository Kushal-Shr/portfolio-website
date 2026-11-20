import { achievements, experience, leadership, profile, projects, skillGroups } from '@/content';
import { learning } from '@/content/skills';
import { exec } from '@/lib/shell/exec';
import { buildVirtualFs } from '@/lib/shell/fs';
import type { ExecResult, Line, ShellContext, ShellState } from '@/lib/shell/types';

export const ctx: ShellContext = {
  fs: buildVirtualFs({
    profile,
    experience,
    projects,
    leadership,
    achievements,
    skillGroups,
    learning,
  }),
  now: () => new Date(2026, 10, 19, 14, 5),
  info: {
    email: profile.email,
    github: profile.links.github,
    linkedin: profile.links.linkedin,
  },
};

export const state = (cwd = '~', extra: Partial<ShellState> = {}): ShellState => ({
  cwd,
  history: [],
  ...extra,
});

export const run = (input: string, cwd = '~', extra: Partial<ShellState> = {}): ExecResult =>
  exec(input, state(cwd, extra), ctx);

/** A line as plain text (links as `prefix + text -> href`). */
export function plain(line: Line): string {
  switch (line.kind) {
    case 'text':
      return line.segments.map((s) => s.text).join('');
    case 'link':
      return `${line.prefix ?? ''}${line.text} -> ${line.href}`;
    case 'items':
      return line.items.map((s) => s.text).join('  ');
    case 'neofetch':
      return '[neofetch]';
  }
}

export const out = (input: string, cwd = '~', extra: Partial<ShellState> = {}): string[] =>
  run(input, cwd, extra).lines.map(plain);
