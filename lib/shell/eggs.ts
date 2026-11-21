import { GIT_LOG_PATH } from './fs';
import { link, text } from './lines';
import type { Line, ShellContext } from './types';

const COW_WIDTH = 36;

const wrap = (message: string, width: number): string[] => {
  const lines: string[] = [];
  let current = '';
  for (const word of message.split(/\s+/).filter(Boolean)) {
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = '';
    }
    current = current ? `${current} ${word}` : word;
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['moo'];
};

/** The classic cow, with `message` in the bubble. No dependency, ~15 lines. */
export function cowsay(message: string): string[] {
  const lines = wrap(message, COW_WIDTH).map((l) => l.slice(0, COW_WIDTH));
  const width = Math.max(...lines.map((l) => l.length));
  const edge = (i: number): [string, string] => {
    if (lines.length === 1) return ['<', '>'];
    if (i === 0) return ['/', '\\'];
    return i === lines.length - 1 ? ['\\', '/'] : ['|', '|'];
  };
  const bubble = lines.map((l, i) => `${edge(i)[0]} ${l.padEnd(width)} ${edge(i)[1]}`);
  return [
    ` ${'_'.repeat(width + 2)}`,
    ...bubble,
    ` ${'-'.repeat(width + 2)}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ];
}

const EDITORS = ['vim', 'vi', 'nano', 'emacs'];
const LOCKED_OUT = ['matrix', 'hack'];

/**
 * The commands `help` doesn't list. Returns `undefined` for anything that isn't one, so `exec`
 * can fall through to "command not found".
 */
export function easterEgg(
  cmd: string,
  args: readonly string[],
  ctx: ShellContext,
): Line[] | undefined {
  const target = args.find((a) => !a.startsWith('-'));

  if (cmd === 'rm') {
    const what = target ?? '';
    return [
      text(
        what
          ? `rm: cannot remove '${what}': this portfolio is read-only (but my calendar isn't: sudo hire-me)`
          : 'rm: missing operand (this portfolio is read-only anyway: sudo hire-me)',
        'err',
      ),
    ];
  }

  if (EDITORS.includes(cmd)) {
    return [
      text(`${cmd}: not installed. the only editor here is reality. try: cat about.md`, 'warn'),
    ];
  }

  if (LOCKED_OUT.includes(cmd)) return [text('access denied. nice try, though.', 'err')];

  if (cmd === 'git') {
    if (args[0] === 'log') {
      const log = ctx.fs[GIT_LOG_PATH];
      if (log?.type !== 'file' || log.lines.length === 0) {
        return [text('fatal: your current branch has no commits yet', 'dim')];
      }
      return log.lines;
    }
    return [
      text('git: nothing to commit here. the real repositories live on GitHub:', 'dim'),
      link('', ctx.info.github.label, ctx.info.github.href, true),
    ];
  }

  if (cmd === 'ping') {
    if (!target) return [text('usage: ping kushal', 'dim')];
    if (target.toLowerCase() !== 'kushal') {
      return [text(`ping: ${target}: unknown host. try: ping kushal`, 'err')];
    }
    return [
      text('PONG — usually replies within a day:', 'ok'),
      link('  ', ctx.info.email, `mailto:${ctx.info.email}`, true, ctx.info.email),
    ];
  }

  if (cmd === 'cowsay') return cowsay(args.join(' ')).map((l) => text(l));

  return undefined;
}
