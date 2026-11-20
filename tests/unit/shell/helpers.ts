import { buildSiteFs, shellInfo } from '@/lib/site-data';
import { exec } from '@/lib/shell/exec';
import type { ExecResult, Line, ShellContext, ShellState } from '@/lib/shell/types';

export const ctx: ShellContext = {
  fs: buildSiteFs(),
  now: () => new Date(2026, 10, 19, 14, 5),
  info: shellInfo,
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
