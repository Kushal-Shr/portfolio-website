import { parseDay } from '@/lib/journey/dates';
import { readJourney, toMeta } from '@/lib/journey/load';
import { buildSiteFs, shellInfo } from '@/lib/site-data';
import { exec } from '@/lib/shell/exec';
import type { ExecResult, Line, ShellContext, ShellState } from '@/lib/shell/types';

export const ctx: ShellContext = {
  fs: buildSiteFs(),
  now: () => new Date(2026, 10, 19, 14, 5),
  info: shellInfo,
};

/** The fake fixture entries (`tests/fixtures/journey`), read as if today were 2026-11-20. */
export const FIXTURE_DIR = 'tests/fixtures/journey';
export const FIXTURE_TODAY = parseDay('2026-11-20');
export const fixtureEntries = await readJourney(FIXTURE_DIR, FIXTURE_TODAY);
export const fixtureMeta = fixtureEntries.map(toMeta);

/** The same shell, with the fixture journey in its filesystem. */
export const journeyCtx: ShellContext = { ...ctx, fs: buildSiteFs(fixtureMeta) };

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

export const runJ = (input: string, cwd = '~'): ExecResult => exec(input, state(cwd), journeyCtx);
export const outJ = (input: string, cwd = '~'): string[] => runJ(input, cwd).lines.map(plain);
