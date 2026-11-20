import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addDays,
  dayNumber,
  formatDay,
  formatMonth,
  parseDay,
  toIsoDay,
  todayLocal,
  tryParseDay,
  weekday,
} from '@/lib/journey/dates';

const iso = (s: string, n: number) => toIsoDay(addDays(parseDay(s), n));

describe('parseDay', () => {
  it('reads the components without going through an instant', () => {
    expect(parseDay('2026-11-19')).toEqual({ y: 2026, m: 11, d: 19 });
  });

  it('rejects anything that is not a real calendar date', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '2026-11-1', '26-11-19', 'today', '']) {
      expect(tryParseDay(bad), bad).toBeUndefined();
    }
    expect(() => parseDay('2026-02-30')).toThrow(/YYYY-MM-DD/);
    expect(tryParseDay('2028-02-29')).toEqual({ y: 2028, m: 2, d: 29 });
    expect(tryParseDay('2026-02-29')).toBeUndefined();
  });
});

describe('dayNumber and addDays', () => {
  it('counts days since the epoch', () => {
    expect(dayNumber(parseDay('1970-01-01'))).toBe(0);
    expect(dayNumber(parseDay('1970-01-02'))).toBe(1);
  });

  it('crosses month and year boundaries', () => {
    expect(iso('2026-01-31', 1)).toBe('2026-02-01');
    expect(iso('2026-02-28', 1)).toBe('2026-03-01');
    expect(iso('2028-02-28', 1)).toBe('2028-02-29');
    expect(iso('2026-12-31', 1)).toBe('2027-01-01');
    expect(iso('2027-01-01', -1)).toBe('2026-12-31');
    expect(iso('2026-11-19', -365)).toBe('2025-11-19');
  });

  it('is exact through DST weeks (one day is always one day)', () => {
    // US daylight saving: starts 2026-03-08, ends 2026-11-01.
    expect(dayNumber(parseDay('2026-03-09')) - dayNumber(parseDay('2026-03-07'))).toBe(2);
    expect(dayNumber(parseDay('2026-11-02')) - dayNumber(parseDay('2026-10-31'))).toBe(2);
    expect(iso('2026-03-07', 1)).toBe('2026-03-08');
    expect(iso('2026-03-08', 1)).toBe('2026-03-09');
    expect(iso('2026-10-31', 1)).toBe('2026-11-01');
    expect(iso('2026-11-01', 1)).toBe('2026-11-02');
  });
});

describe('formatting', () => {
  it('formats like Date#toDateString', () => {
    expect(formatDay(parseDay('2026-11-19'))).toBe('Thu Nov 19 2026');
    expect(formatDay(parseDay('2026-11-01'))).toBe('Sun Nov 01 2026');
    expect(formatDay(parseDay('2027-01-01'))).toBe('Fri Jan 01 2027');
    expect(formatMonth(parseDay('2026-11-19'))).toBe('November 2026');
  });

  it('knows the weekday', () => {
    expect(weekday(parseDay('2026-11-15'))).toBe(0); // Sunday
    expect(weekday(parseDay('2026-11-21'))).toBe(6); // Saturday
    expect(weekday(parseDay('1969-12-31'))).toBe(3); // before the epoch, still right
  });
});

describe('todayLocal', () => {
  const original = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = 'America/Chicago';
  });
  afterEach(() => {
    process.env.TZ = original;
  });

  it("is the viewer's calendar date, not UTC's", () => {
    // 03:00 UTC on Nov 20 is still the evening of Nov 19 in St. Louis.
    expect(toIsoDay(todayLocal(new Date('2026-11-20T03:00:00Z')))).toBe('2026-11-19');
    expect(toIsoDay(todayLocal(new Date('2026-11-20T06:00:00Z')))).toBe('2026-11-20');
  });

  it('shows why `new Date("YYYY-MM-DD")` is never used', () => {
    expect(new Date('2026-11-19').getDate()).toBe(18);
    expect(toIsoDay(parseDay('2026-11-19'))).toBe('2026-11-19');
  });

  it('is right on the DST change days', () => {
    expect(toIsoDay(todayLocal(new Date('2026-11-01T05:30:00Z')))).toBe('2026-11-01');
    expect(toIsoDay(todayLocal(new Date('2026-03-08T07:30:00Z')))).toBe('2026-03-08');
  });
});
