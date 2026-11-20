export type RangeStyle = 'arrow' | 'dash' | 'years';

const year = (ym: string): string => ym.slice(0, 4);

/** Formats a `YYYY-MM` range for the experience log (arrow), resume (dash) or man page (years). */
export function formatRange(start: string, end: string, style: RangeStyle): string {
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
