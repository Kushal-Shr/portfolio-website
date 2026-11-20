const pad = (n: number): string => (n < 10 ? '0' : '') + n;

/** Formats a date as the tmux clock shows it, e.g. `Thu Nov 19 14:05` (local time). */
export function formatClock(date: Date): string {
  return `${date.toDateString().slice(0, 10)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
