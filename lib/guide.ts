import type { GuideItem } from '@/content/types';
import { neofetchRows } from '@/lib/neofetch';
import { complete } from '@/lib/shell/complete';
import { exec } from '@/lib/shell/exec';
import { text } from '@/lib/shell/lines';
import { buildSiteFs, shellInfo } from '@/lib/site-data';
import type { Line, ShellContext, ShellState } from '@/lib/shell/types';

export const DEFAULT_MAX_LINES = 4;

export type GuideExample = { lines: Line[]; truncated: boolean };
export type GuideOptions = Pick<GuideItem, 'setup' | 'show' | 'maxLines' | 'complete'>;

/** The same context the home page builds, so guide examples can't drift from the real shell. */
export function createGuideContext(now: Date = new Date()): ShellContext {
  return {
    fs: buildSiteFs(),
    now: () => now,
    info: shellInfo,
  };
}

/** Keeps the first `max` body lines and appends `…`; trailing "open as a page" links survive. */
function truncate(lines: Line[], max: number): GuideExample {
  const links = lines.filter((l) => l.kind === 'link');
  const body = lines.filter((l) => l.kind !== 'link');
  if (body.length <= max) return { lines, truncated: false };
  return { lines: [...body.slice(0, max), text('…', 'dim'), ...links], truncated: true };
}

/** A compact text stand-in for the neofetch card (the portrait is too big for an example). */
function compactNeofetch(now: Date): Line[] {
  const rows = neofetchRows(now).slice(0, 2);
  const indent = ' '.repeat('[ascii portrait]   '.length);
  return [
    text('[ascii portrait]   guest@portfolio'),
    ...rows.map((r) => text(`${indent}${r.label}:  ${r.value}`)),
    text('…', 'dim'),
  ];
}

/**
 * Runs a guide command through the real shell engine and returns display lines. Setup commands
 * run first (so `cd ..` has somewhere to go back from), then the example itself.
 */
export function renderGuideExample(
  cmd: string,
  opts: GuideOptions = {},
  ctx: ShellContext = createGuideContext(),
): GuideExample {
  let state: ShellState = { cwd: '~', history: [] };
  const step = (input: string) => {
    const result = exec(input, state, ctx);
    state = {
      cwd: result.cwd,
      prevCwd: result.cwd !== state.cwd ? state.cwd : state.prevCwd,
      history: [...state.history, input],
    };
    return result;
  };
  for (const input of opts.setup ?? []) step(input);

  if (opts.complete) {
    return { lines: [text(complete(cmd, state, ctx).value)], truncated: false };
  }

  const command = opts.show ?? cmd;
  if (command === 'neofetch') return { lines: compactNeofetch(ctx.now()), truncated: true };

  const before = state.cwd;
  const result = step(command);
  const lines = [...result.lines];
  // A directory change prints nothing useful on its own, so say what happened.
  if (result.cwd !== before && !result.clear) {
    lines.unshift(text(`the prompt changes to ${result.cwd}`));
  }
  return truncate(lines, opts.maxLines ?? DEFAULT_MAX_LINES);
}
