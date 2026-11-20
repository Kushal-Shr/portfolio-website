/**
 * Calendar dates, not instants. `new Date('2026-11-19')` is UTC midnight, which is the evening
 * of Nov 18 in St. Louis; everything here works on the `{ y, m, d }` components instead, and only
 * uses `Date.UTC` as a calculator, so time zones and DST can never shift a day.
 */
export type Day = { y: number; m: number; d: number };

const MS_PER_DAY = 86_400_000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD`; returns `undefined` for anything that is not a real calendar date. */
export function tryParseDay(s: string): Day | undefined {
  const match = ISO_DAY.exec(s);
  if (!match) return undefined;
  const day = { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  // Round-trip through the calculator: 2026-02-30 comes back as March 2nd and is rejected.
  const back = fromDayNumber(dayNumber(day));
  return back.y === day.y && back.m === day.m && back.d === day.d ? day : undefined;
}

export function parseDay(s: string): Day {
  const day = tryParseDay(s);
  if (!day) throw new Error(`not a calendar date (YYYY-MM-DD): ${s}`);
  return day;
}

/** Days since 1970-01-01. */
export function dayNumber(day: Day): number {
  return Math.round(Date.UTC(day.y, day.m - 1, day.d) / MS_PER_DAY);
}

export function fromDayNumber(n: number): Day {
  const date = new Date(n * MS_PER_DAY);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

export function addDays(day: Day, n: number): Day {
  return fromDayNumber(dayNumber(day) + n);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(day: Day): number {
  return (((dayNumber(day) + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

/** `2026-11-19`. */
export function toIsoDay(day: Day): string {
  return `${pad(day.y, 4)}-${pad(day.m)}-${pad(day.d)}`;
}

/** `Thu Nov 19 2026`, the same shape as `Date#toDateString`. */
export function formatDay(day: Day): string {
  return `${WEEKDAYS[weekday(day)]} ${MONTHS[day.m - 1]} ${pad(day.d)} ${day.y}`;
}

/** `November 2026`, for grouping the archive. */
export function formatMonth(day: Day): string {
  const long = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });
  return `${long.format(Date.UTC(day.y, day.m - 1, 1))} ${day.y}`;
}

/** The viewer's (or build machine's) calendar date, read from the local clock. */
export function todayLocal(now: Date = new Date()): Day {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

export const WEEKDAY_NAMES = WEEKDAYS;
export const MONTH_NAMES = MONTHS;
