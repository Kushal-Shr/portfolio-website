import type { Achievement, Experience } from '@/content/types';

export type Milestone = { hash: string; text: string };

/** A stable 7-character hash for entries that have no commit hash of their own. */
export function shortHash(seed: string): string {
  let h = 0x811c9dc5;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

/**
 * The shell's `git log --oneline`: every job's first day and every dated competition win, newest
 * first. A win only has a year, so it sorts after any job that started in the same year.
 */
export function milestones(jobs: readonly Experience[], wins: readonly Achievement[]): Milestone[] {
  const rows = [
    ...jobs.map((e) => ({
      key: e.start,
      hash: e.commit,
      text: `started: ${e.title} @ ${e.orgShort ?? e.org} (${e.start})`,
    })),
    ...wins.flatMap((a) =>
      a.year
        ? [
            {
              key: `${a.year}-13`,
              hash: shortHash(a.id),
              text: `won: ${a.award}, ${a.event}`,
            },
          ]
        : [],
    ),
  ];
  return rows.sort((a, b) => b.key.localeCompare(a.key)).map(({ hash, text }) => ({ hash, text }));
}
