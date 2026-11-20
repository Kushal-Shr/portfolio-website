import { formatMonth, parseDay } from './dates';
import type { JourneyMeta } from './types';

export const ARCHIVE_LEARNED_MAX = 60;

export const permalink = (date: string): string => `/journey/${date}/`;
export const RSS_PATH = '/journey/rss.xml';
export const ARCHIVE_HREF = '/journey/archive/';

export function truncate(value: string, max: number): string {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** The parts of `2026-11-19  day 12    learned: …`, the archive's one line per entry. */
export function archiveLine(e: JourneyMeta): { day: string; learned: string } {
  return {
    day: `  ${`day ${e.day}`.padEnd(8)}`,
    learned: `learned: ${truncate(e.learned, ARCHIVE_LEARNED_MAX)}`,
  };
}

export type ArchiveMonth = { key: string; label: string; entries: JourneyMeta[] };

/** Entries grouped by calendar month, keeping the input order (newest first). */
export function groupByMonth(entries: readonly JourneyMeta[]): ArchiveMonth[] {
  const months: ArchiveMonth[] = [];
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    let month = months.at(-1);
    if (month?.key !== key) {
      month = { key, label: formatMonth(parseDay(e.date)), entries: [] };
      months.push(month);
    }
    month.entries.push(e);
  }
  return months;
}
