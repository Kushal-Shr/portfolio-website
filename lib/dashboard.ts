import type { Achievement } from '@/content/types';

export type GitLogEntry = { name: string; award: string; venue: string };

/** The dashboard's `git log --oneline` rows, derived from the achievements. */
export function gitLogEntries(achievements: readonly Achievement[]): GitLogEntry[] {
  return achievements.map((a) => a.logEntry);
}
