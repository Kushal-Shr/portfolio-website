import {
  dayNumber,
  fromDayNumber,
  parseDay,
  toIsoDay,
  WEEKDAY_NAMES,
  weekday,
  type Day,
} from './dates';

/** All functions take `today`: there is no hidden clock, so the client can recompute them. */

export const HEATMAP_WEEKS = 26;

const numbers = (dates: readonly string[]): number[] =>
  dates.map((d) => dayNumber(parseDay(d))).sort((a, b) => a - b);

/** Day 1 is the first entry; a later entry is labelled by how many days after it, + 1. */
export function dayOf(firstDate: string, date: string): number {
  return dayNumber(parseDay(date)) - dayNumber(parseDay(firstDate)) + 1;
}

/** The header's `day N`: today relative to the first entry, or 0 with no entries yet. */
export function headerDay(dates: readonly string[], today: Day): number {
  const [first] = numbers(dates);
  if (first === undefined) return 0;
  return Math.max(0, dayNumber(today) - first + 1);
}

/**
 * Consecutive logged days ending today, or yesterday when today's entry isn't posted yet (so
 * the streak doesn't drop to 0 every morning). Entries after `today` don't count.
 */
export function currentStreak(dates: readonly string[], today: Day): number {
  const logged = new Set(numbers(dates));
  const t = dayNumber(today);
  let cursor = logged.has(t) ? t : t - 1;
  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

export function longestStreak(dates: readonly string[]): number {
  const sorted = [...new Set(numbers(dates))];
  let best = 0;
  let run = 0;
  sorted.forEach((n, i) => {
    run = i > 0 && n === (sorted[i - 1] ?? NaN) + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export type HeatCell = { date: string; logged: boolean; future: boolean };

export type Heatmap = {
  /** Columns, oldest week first; each column is Sun..Sat. */
  weeks: HeatCell[][];
  /** Row labels, Sun..Sat: only Mon, Wed and Fri are shown, as in the design. */
  labels: string[];
  /** Entries that fall inside the grid. */
  logged: number;
};

/**
 * The design's grid: `weeks` columns × 7 rows, with today in the last column at its weekday row
 * and the days after it blank.
 */
export function heatmap(dates: readonly string[], today: Day, weeks = HEATMAP_WEEKS): Heatmap {
  const logged = new Set(numbers(dates));
  const t = dayNumber(today);
  const tw = weekday(today);
  // Days between the top-left cell (a Sunday) and today.
  const back = weeks * 7 - 1 - (6 - tw);
  let count = 0;
  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, wd): HeatCell => {
      const n = t - (back - (w * 7 + wd));
      const future = n > t;
      const on = !future && logged.has(n);
      if (on) count += 1;
      return { date: toIsoDay(fromDayNumber(n)), logged: on, future };
    }),
  );
  return {
    weeks: columns,
    labels: WEEKDAY_NAMES.map((name, i) => (i % 2 ? name : '')),
    logged: count,
  };
}

export type JourneyStats = {
  day: number;
  streak: number;
  longest: number;
  grid: Heatmap;
};

export function journeyStats(dates: readonly string[], today: Day): JourneyStats {
  return {
    day: headerDay(dates, today),
    streak: currentStreak(dates, today),
    longest: longestStreak(dates),
    grid: heatmap(dates, today),
  };
}
