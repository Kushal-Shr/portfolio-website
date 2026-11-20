/** Optimal string alignment distance: Levenshtein where swapping two letters costs 1. */
export function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = best;
    }
  }
  return d[a.length]![b.length]!;
}

/** The closest known command, if it is close enough to be a plausible typo. */
export function suggest(word: string, commands: readonly string[]): string | undefined {
  const limit = word.length <= 4 ? 1 : 2;
  let best: { name: string; d: number } | undefined;
  for (const name of commands) {
    const d = distance(word, name);
    if (d <= limit && (!best || d < best.d)) best = { name, d };
  }
  return best?.name;
}
