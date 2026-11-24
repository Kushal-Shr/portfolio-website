export type RangeStyle = 'arrow' | 'dash' | 'years' | 'long';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** `2025-05` → `May 2025`. */
const longMonth = (ym: string): string =>
  `${MONTHS[Number(ym.slice(5, 7)) - 1] ?? ''} ${ym.slice(0, 4)}`;

const year = (ym: string): string => ym.slice(0, 4);

/**
 * Formats a `YYYY-MM` range for the experience log (arrow), shell (dash), man page (years) or
 * resume (long: `May 2025 - September 2026`, as the PDF prints it).
 */
export function formatRange(start: string, end: string, style: RangeStyle): string {
  if (style === 'long')
    return `${longMonth(start)} - ${end === 'present' ? 'Present' : longMonth(end)}`;
  const to = end === 'present' ? 'present' : end;
  if (style === 'arrow') return `${start} → ${to}`;
  if (style === 'dash') return `${start} – ${to}`;
  const endYear = end === 'present' ? 'present' : year(end);
  return year(start) === endYear ? year(start) : `${year(start)}–${endYear}`;
}

/** Whole years between a `YYYY-MM` start and `now`. */
export function yearsSince(start: string, now: Date): number {
  const [y, m] = start.split('-').map(Number) as [number, number];
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.max(0, Math.floor(months / 12));
}

/** `November 2026`, in the build machine's locale-independent English form. */
export function formatMonthYear(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/** `AI, data, full-stack and DevOps`: the one place the `devops` tag gets its proper casing. */
export function openToSentence(items: readonly string[]): string {
  const words = items.map((item) => (item === 'devops' ? 'DevOps' : item));
  if (words.length < 2) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
