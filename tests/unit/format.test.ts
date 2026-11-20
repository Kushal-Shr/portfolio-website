import { describe, expect, it } from 'vitest';
import { formatRange, yearsSince } from '@/lib/format';
import { neofetchRows } from '@/lib/neofetch';

describe('formatRange', () => {
  it('formats the arrow style', () => {
    expect(formatRange('2025-05', '2026-09', 'arrow')).toBe('2025-05 → 2026-09');
  });

  it('formats the dash style', () => {
    expect(formatRange('2025-05', '2026-09', 'dash')).toBe('2025-05 – 2026-09');
  });

  it('formats the years style, collapsing equal years', () => {
    expect(formatRange('2025-05', '2026-09', 'years')).toBe('2025–2026');
    expect(formatRange('2024-03', '2024-06', 'years')).toBe('2024');
  });

  it('renders an open end as present', () => {
    expect(formatRange('2025-05', 'present', 'arrow')).toBe('2025-05 → present');
    expect(formatRange('2025-05', 'present', 'dash')).toBe('2025-05 – present');
    expect(formatRange('2025-05', 'present', 'years')).toBe('2025–present');
  });
});

describe('yearsSince', () => {
  it('counts whole years', () => {
    expect(yearsSince('2023-09', new Date(2026, 10, 19))).toBe(3);
  });

  it('does not round up before the anniversary month', () => {
    expect(yearsSince('2023-09', new Date(2026, 7, 31))).toBe(2);
    expect(yearsSince('2023-09', new Date(2026, 8, 1))).toBe(3);
  });

  it('never goes negative', () => {
    expect(yearsSince('2030-01', new Date(2026, 0, 1))).toBe(0);
  });
});

describe('neofetchRows', () => {
  const rows = neofetchRows(new Date(2026, 10, 19));
  const value = (label: string) => rows.find((r) => r.label === label)?.value;

  it('resolves references to profile fields', () => {
    expect(value('Name')).toBe('Kushal Shrestha');
    expect(value('Contact')).toBe('kushalshrestha@webster.edu');
    expect(value('Location')).toBe('St. Louis, MO');
  });

  it('computes uptime from the earliest experience start', () => {
    expect(value('Uptime')).toBe('3 years shipping software');
  });

  it('keeps all nine rows', () => {
    expect(rows).toHaveLength(9);
  });
});
