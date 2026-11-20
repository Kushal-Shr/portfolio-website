import matter from 'gray-matter';
import { z } from 'zod';
import { addDays, dayNumber, toIsoDay, tryParseDay, type Day } from './dates';
import type { JourneyFields } from './types';

const MAX_TEXT = 280;
const TAG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = z
  .string({
    error: (iss) =>
      iss.input === undefined || iss.input === null ? 'is required' : 'must be text',
  })
  .trim()
  .min(1, { error: 'is required (it is empty)' })
  .max(MAX_TEXT, { error: `is too long (max ${MAX_TEXT} characters)` });

// An empty `stuck_on:` or `built_link: ""` (the template's defaults) means "not today".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === null || v === '' ? undefined : v), schema.optional());

const Frontmatter = z
  .object({
    date: z.string({ error: (iss) => (iss.input == null ? 'is required' : 'must be YYYY-MM-DD') }),
    learned: requiredText,
    built: requiredText,
    built_link: optional(
      z.string({ error: 'must be a link' }).refine(
        (v) => {
          try {
            return new URL(v).protocol === 'https:';
          } catch {
            return false;
          }
        },
        { error: 'must be an https:// link' },
      ),
    ),
    stuck_on: optional(
      z
        .string({ error: 'must be text' })
        .trim()
        .max(MAX_TEXT, { error: `is too long (max ${MAX_TEXT} characters)` }),
    ),
    next: requiredText,
    tags: z.preprocess(
      (v) => (v === null || v === undefined ? [] : v),
      z.array(
        z.string({ error: 'must be a list of words' }).regex(TAG, {
          error: 'must be lowercase words joined by dashes (a-z, 0-9, -)',
        }),
        { error: 'must be a list, e.g. [airflow, nextjs]' },
      ),
    ),
  })
  .strict();

export class JourneyError extends Error {
  override name = 'JourneyError';
}

/**
 * YAML reads an unquoted `date: 2026-11-19` as a timestamp (UTC midnight). Take its UTC
 * components back, so the calendar date survives whatever zone the build runs in.
 */
function normalizeDate(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDay({
      y: value.getUTCFullYear(),
      m: value.getUTCMonth() + 1,
      d: value.getUTCDate(),
    });
  }
  return value;
}

export type ParsedEntry = { fields: JourneyFields; body: string };

/**
 * Validates one entry file. Every problem is reported as `<file>: "<field>" <what is wrong>`, one
 * per line, so a bad entry fails the build with a message that says exactly what to fix.
 */
export function parseJourneyFile(raw: string, file: string, today: Day): ParsedEntry {
  const problem = (problems: string[]) =>
    new JourneyError(problems.map((p) => `${file}: ${p}`).join('\n'));

  const name = file.slice(file.lastIndexOf('/') + 1);
  const stem = name.replace(/\.md$/, '');
  if (!tryParseDay(stem))
    throw problem([`the file name must be a date, YYYY-MM-DD.md (got ${name})`]);

  let parsed: ReturnType<typeof matter>;
  try {
    // A fresh object each time: gray-matter caches by content and would hand back shared data.
    parsed = matter(raw, {});
  } catch (error) {
    throw problem([`could not read the frontmatter (${(error as Error).message})`]);
  }

  const data = { ...parsed.data, date: normalizeDate(parsed.data.date) };
  const result = Frontmatter.safeParse(data);
  if (!result.success) {
    throw problem(
      result.error.issues.map((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return issue.keys.map((k) => `unknown field "${k}"`).join(', ');
        }
        const [field, index] = issue.path;
        const where =
          index === undefined ? `"${String(field)}"` : `"${String(field)}[${String(index)}]"`;
        return `${where} ${issue.message}`;
      }),
    );
  }
  const fm = result.data;

  const day = tryParseDay(fm.date);
  if (!day) throw problem([`"date" must be a real calendar date, YYYY-MM-DD (got ${fm.date})`]);
  if (fm.date !== stem) throw problem([`"date" (${fm.date}) must match the file name (${stem})`]);
  if (dayNumber(day) > dayNumber(addDays(today, 1))) {
    throw problem([`"date" (${fm.date}) is in the future (today is ${toIsoDay(today)})`]);
  }

  const fields: JourneyFields = {
    date: fm.date,
    learned: fm.learned,
    built: fm.built,
    next: fm.next,
    tags: fm.tags,
    ...(fm.built_link ? { builtLink: fm.built_link } : {}),
    ...(fm.stuck_on ? { stuckOn: fm.stuck_on } : {}),
  };
  return { fields, body: parsed.content.trim() };
}
