import { describe, expect, it } from 'vitest';
import { achievements } from '@/content/achievements';
import { gitLogEntries } from '@/lib/dashboard';
import { formatMonthYear, openToSentence } from '@/lib/format';

describe('man page date and sentence formatting', () => {
  it('formats the build date as "Month YYYY"', () => {
    expect(formatMonthYear(new Date(2026, 10, 19))).toBe('November 2026');
    expect(formatMonthYear(new Date(2027, 0, 1))).toBe('January 2027');
  });

  it('joins openTo into a sentence with DevOps casing', () => {
    expect(openToSentence(['AI', 'data', 'full-stack', 'devops'])).toBe(
      'AI, data, full-stack and DevOps',
    );
    expect(openToSentence(['AI'])).toBe('AI');
  });
});

describe('dashboard git log', () => {
  it('derives one entry per achievement, in order', () => {
    const entries = gitLogEntries(achievements);
    expect(entries.map((e) => e.name)).toEqual(['hackfest', 'pickhacks', 'bytebash']);
    expect(entries[0]).toEqual({
      name: 'hackfest',
      award: 'Best Overall',
      venue: 'Webster · 2025',
    });
  });
});
