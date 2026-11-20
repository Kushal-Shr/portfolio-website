import { describe, expect, it } from 'vitest';
import { formatClock } from '@/lib/time';

describe('formatClock', () => {
  it('formats weekday, month, day and zero-padded time', () => {
    expect(formatClock(new Date(2026, 10, 19, 14, 5))).toBe('Thu Nov 19 14:05');
  });

  it('pads single-digit hours and minutes', () => {
    expect(formatClock(new Date(2026, 0, 2, 3, 4))).toBe('Fri Jan 02 03:04');
  });

  it('is always 16 characters (the clock placeholder width)', () => {
    expect(formatClock(new Date(2026, 11, 31, 23, 59))).toHaveLength(16);
  });
});
