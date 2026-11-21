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

const normalize = (pathname: string): string =>
  `/${(pathname.split(/[?#]/)[0] ?? '').split('/').filter(Boolean).join('/')}/`.replace('//', '/');

/**
 * The page a mistyped URL most likely meant: the closest `href` by edit distance, or else the
 * deepest page above it that exists, or `undefined` when neither applies. The distance is taken
 * over the whole path, so `/projects/zenit/` lands on `/projects/zenith/` and `/skills/pyhton/`
 * on `/skills/python/`; `/projects/nope/` is no typo of anything, but `/projects/` is a fair guess.
 */
export function suggestPage(pathname: string, hrefs: readonly string[]): string | undefined {
  const wanted = normalize(pathname).toLowerCase();
  // A few edits are a typo; more than a fifth of the path is a different page.
  const limit = Math.max(2, Math.floor(wanted.length / 5));
  let best: { href: string; d: number } | undefined;
  for (const href of hrefs) {
    if (href === '/') continue;
    const d = distance(wanted, href.toLowerCase());
    if (d <= limit && (!best || d < best.d)) best = { href, d };
  }
  if (best) return best.href;

  const known = new Set(hrefs.map((href) => href.toLowerCase()));
  const parts = wanted.split('/').filter(Boolean);
  for (let depth = parts.length - 1; depth >= 1; depth--) {
    const ancestor = `/${parts.slice(0, depth).join('/')}/`;
    if (known.has(ancestor)) return hrefs.find((href) => href.toLowerCase() === ancestor);
  }
  return undefined;
}
