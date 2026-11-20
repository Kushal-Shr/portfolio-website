import { describe, expect, it } from 'vitest';
import { addDays, parseDay, toIsoDay } from '@/lib/journey/dates';
import {
  currentStreak,
  dayOf,
  headerDay,
  heatmap,
  journeyStats,
  longestStreak,
} from '@/lib/journey/stats';

const today = parseDay('2026-11-19'); // a Thursday
const back = (n: number) => toIsoDay(addDays(today, -n));

describe('day numbers', () => {
  it('labels entries relative to the first one, stable across skipped days', () => {
    expect(dayOf('2026-11-01', '2026-11-01')).toBe(1);
    expect(dayOf('2026-11-01', '2026-11-19')).toBe(19);
    expect(dayOf('2026-12-31', '2027-01-01')).toBe(2);
  });

  it("puts today's day number in the header, or 0 with no entries", () => {
    expect(headerDay([], today)).toBe(0);
    expect(headerDay(['2026-11-19'], today)).toBe(1);
    expect(headerDay(['2026-11-10', '2026-11-01'], today)).toBe(19);
    expect(headerDay(['2026-11-20'], today)).toBe(0);
  });
});

describe('streaks', () => {
  it('is 0 with no entries', () => {
    expect(currentStreak([], today)).toBe(0);
    expect(longestStreak([])).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak([back(0), back(1), back(2)], today)).toBe(3);
    expect(currentStreak([back(0), back(2)], today)).toBe(1);
  });

  it("still counts in the morning, before today's entry (ends yesterday)", () => {
    expect(currentStreak([back(1), back(2), back(3)], today)).toBe(3);
  });

  it('drops to 0 once yesterday was missed too', () => {
    expect(currentStreak([back(2), back(3)], today)).toBe(0);
  });

  it('ignores entries after today (time-zone skew)', () => {
    expect(currentStreak([back(-1), back(1)], today)).toBe(1);
  });

  it('finds the longest run, across a month and a DST change', () => {
    const run = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'];
    expect(longestStreak([...run, '2026-11-05', '2026-11-06'])).toBe(4);
    expect(longestStreak(['2026-12-31', '2027-01-01'])).toBe(2);
    expect(longestStreak(['2026-11-19', '2026-11-19'])).toBe(1);
  });
});

describe('heatmap', () => {
  it('is 26 weeks of Sun..Sat with Mon/Wed/Fri labels', () => {
    const grid = heatmap([], today);
    expect(grid.weeks).toHaveLength(26);
    for (const week of grid.weeks) expect(week).toHaveLength(7);
    expect(grid.labels).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
    expect(grid.logged).toBe(0);
    expect(grid.weeks.flat().every((c) => !c.logged)).toBe(true);
  });

  it('puts today in the last column at its weekday row, and blanks the days after', () => {
    const last = heatmap([], today).weeks.at(-1) ?? [];
    expect(last.map((c) => c.date)).toEqual([
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
    ]);
    expect(last.map((c) => c.future)).toEqual([false, false, false, false, false, true, true]);
  });

  it('starts on a Sunday 25 weeks before this week', () => {
    const grid = heatmap([], today);
    expect(grid.weeks[0]?.[0]?.date).toBe('2026-05-24');
    const all = grid.weeks.flat().map((c) => c.date);
    expect(new Set(all).size).toBe(26 * 7);
  });

  it('marks logged days, counts only the ones inside the grid', () => {
    const grid = heatmap(['2026-11-19', '2026-11-16', '2026-01-01', '2026-11-20'], today);
    const logged = grid.weeks
      .flat()
      .filter((c) => c.logged)
      .map((c) => c.date);
    expect(logged).toEqual(['2026-11-16', '2026-11-19']);
    expect(grid.logged).toBe(2);
  });

  it('works when today is a Saturday or a Sunday', () => {
    const sat = heatmap([], parseDay('2026-11-21')).weeks.at(-1) ?? [];
    expect(sat.every((c) => !c.future)).toBe(true);
    const sun = heatmap([], parseDay('2026-11-22')).weeks.at(-1) ?? [];
    expect(sun.filter((c) => c.future)).toHaveLength(6);
  });
});

describe('a build on day X viewed on day X+3', () => {
  const dates = ['2026-11-17', '2026-11-18', '2026-11-19'];
  const built = journeyStats(dates, today);
  const viewedNextDay = journeyStats(dates, addDays(today, 1));
  const viewed = journeyStats(dates, addDays(today, 3));

  it('shows the build-day values first', () => {
    expect(built).toMatchObject({ day: 3, streak: 3, longest: 3 });
  });

  it('keeps the streak the next morning (yesterday rule)', () => {
    expect(viewedNextDay).toMatchObject({ day: 4, streak: 3 });
  });

  it("drops the streak and moves day N on the viewer's own day", () => {
    expect(viewed).toMatchObject({ day: 6, streak: 0, longest: 3 });
  });

  it('shifts the grid so the viewer’s today is the last column', () => {
    const last = viewed.grid.weeks.at(-1) ?? [];
    expect(last[0]?.date).toBe('2026-11-22');
    expect(last.filter((c) => !c.future).map((c) => c.date)).toEqual(['2026-11-22']);
    const week = viewed.grid.weeks.at(-2) ?? [];
    expect(week.filter((c) => c.logged).map((c) => c.date)).toEqual(dates);
  });
});
