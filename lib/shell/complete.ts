import { COMMANDS } from './commands';
import { isDir, joinPath, resolve } from './resolve';
import type { ShellContext, ShellState } from './types';

export type Completion = { value: string; candidates: string[] };

function commonPrefix(words: readonly string[]): string {
  const first = words[0] ?? '';
  let n = first.length;
  for (const w of words) while (n > 0 && !w.startsWith(first.slice(0, n))) n--;
  return first.slice(0, n);
}

/**
 * Tab completion. A unique match completes fully; several matches extend to their longest
 * common prefix; when that adds nothing the candidates are returned so the UI can list them.
 */
export function complete(input: string, state: ShellState, ctx: ShellContext): Completion {
  const start = input.search(/\S*$/);
  const head = input.slice(0, start);
  const word = input.slice(start);
  const none: Completion = { value: input, candidates: [] };

  if (head.trim() === '') {
    if (!word) return none;
    const matches = COMMANDS.filter((c) => c.startsWith(word.toLowerCase())).sort();
    if (matches.length === 0) return none;
    if (matches.length === 1) return { value: `${matches[0]} `, candidates: [] };
    const prefix = commonPrefix(matches);
    return prefix.length > word.length
      ? { value: prefix, candidates: [] }
      : { value: input, candidates: matches };
  }

  const cmd = head.trim().split(/\s+/)[0]?.toLowerCase();
  const slash = word.lastIndexOf('/');
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
  const stem = word.slice(slash + 1);
  const dirPath = resolve(dirPart || '.', state.cwd);
  const node = dirPath ? ctx.fs[dirPath] : undefined;
  if (!dirPath || node?.type !== 'dir') return none;

  const names = node.children
    .filter((n) => n.toLowerCase().startsWith(stem.toLowerCase()))
    .filter((n) => cmd !== 'cd' || isDir(ctx.fs, joinPath(dirPath, n)))
    .sort();
  if (names.length === 0) return none;
  const label = (n: string) => (isDir(ctx.fs, joinPath(dirPath, n)) ? `${n}/` : n);

  if (names.length === 1) {
    return { value: `${head}${dirPart}${label(names[0]!)}`, candidates: [] };
  }
  const prefix = commonPrefix(names);
  return prefix.length > stem.length
    ? { value: `${head}${dirPart}${prefix}`, candidates: [] }
    : { value: input, candidates: names.map(label) };
}
