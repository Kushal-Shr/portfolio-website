import { describe, expect, it } from 'vitest';
import { parseDay } from '@/lib/journey/dates';
import { parseJourneyFile } from '@/lib/journey/schema';

const today = parseDay('2026-11-19');
const FILE = 'content/journey/2026-11-19.md';

const entry = (fields: Record<string, string | undefined>, body = '') => {
  const all: Record<string, string | undefined> = {
    date: '2026-11-19',
    learned: 'L',
    built: 'B',
    next: 'N',
    ...fields,
  };
  const yaml = Object.entries(all)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `---\n${yaml}\n---\n${body}`;
};

const parse = (raw: string, file = FILE) => parseJourneyFile(raw, file, today);
const error = (raw: string, file = FILE): string => {
  try {
    parse(raw, file);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error('expected a validation error');
};

describe('journey schema', () => {
  it('accepts a full entry and renames fields', () => {
    const { fields, body } = parse(
      entry(
        {
          built_link: 'https://github.com/x/y',
          stuck_on: 'S',
          tags: '[airflow, next-js]',
        },
        '\nSome notes.\n',
      ),
    );
    expect(fields).toEqual({
      date: '2026-11-19',
      learned: 'L',
      built: 'B',
      builtLink: 'https://github.com/x/y',
      stuckOn: 'S',
      next: 'N',
      tags: ['airflow', 'next-js'],
    });
    expect(body).toBe('Some notes.');
  });

  it('keeps an unquoted YAML date as its calendar day in any time zone', () => {
    expect(parse(entry({})).fields.date).toBe('2026-11-19');
    expect(parse(entry({ date: '"2026-11-19"' })).fields.date).toBe('2026-11-19');
  });

  it('treats the template’s empty optional fields as absent', () => {
    const { fields } = parse(entry({ built_link: '""', stuck_on: '""', tags: '[]' }));
    expect(fields).not.toHaveProperty('builtLink');
    expect(fields).not.toHaveProperty('stuckOn');
    expect(fields.tags).toEqual([]);
  });

  it('names the file and the field that is missing', () => {
    expect(error(entry({ next: undefined }))).toBe(`${FILE}: "next" is required`);
    expect(error(entry({ learned: '""' }))).toBe(`${FILE}: "learned" is required (it is empty)`);
  });

  it('reports every problem, one per line', () => {
    expect(error(entry({ learned: undefined, built: undefined })).split('\n')).toEqual([
      `${FILE}: "learned" is required`,
      `${FILE}: "built" is required`,
    ]);
  });

  it('limits text to 280 characters', () => {
    expect(error(entry({ learned: 'x'.repeat(281) }))).toBe(
      `${FILE}: "learned" is too long (max 280 characters)`,
    );
    expect(() => parse(entry({ learned: 'x'.repeat(280) }))).not.toThrow();
  });

  it('wants https links', () => {
    expect(error(entry({ built_link: 'http://example.com' }))).toBe(
      `${FILE}: "built_link" must be an https:// link`,
    );
    expect(error(entry({ built_link: 'not a url' }))).toMatch(/"built_link" must be an https/);
  });

  it('wants lowercase kebab-case tags', () => {
    expect(error(entry({ tags: '[Airflow]' }))).toBe(
      `${FILE}: "tags[0]" must be lowercase words joined by dashes (a-z, 0-9, -)`,
    );
    expect(error(entry({ tags: '[ok, two words]' }))).toMatch(/"tags\[1\]"/);
    expect(error(entry({ tags: 'airflow' }))).toMatch(/"tags" must be a list/);
  });

  it('catches typos in field names', () => {
    expect(error(entry({ 'stuck-on': 'S' }))).toBe(`${FILE}: unknown field "stuck-on"`);
  });

  it('wants the date to match the file name and be real', () => {
    expect(error(entry({ date: '2026-11-18' }))).toBe(
      `${FILE}: "date" (2026-11-18) must match the file name (2026-11-19)`,
    );
    expect(error(entry({ date: '"2026-02-30"' }))).toMatch(/"date" must be a real calendar date/);
    expect(error(entry({}), 'content/journey/today.md')).toMatch(
      /the file name must be a date, YYYY-MM-DD.md \(got today.md\)/,
    );
  });

  it('allows tomorrow (time-zone skew) but nothing later', () => {
    expect(() =>
      parse(entry({ date: '2026-11-20' }), 'content/journey/2026-11-20.md'),
    ).not.toThrow();
    expect(error(entry({ date: '2026-11-21' }), 'content/journey/2026-11-21.md')).toBe(
      'content/journey/2026-11-21.md: "date" (2026-11-21) is in the future (today is 2026-11-19)',
    );
  });

  it('explains broken frontmatter', () => {
    expect(error('---\nlearned: [unclosed\n---\n')).toMatch(
      /^content\/journey\/2026-11-19.md: could not read the frontmatter/,
    );
  });
});
