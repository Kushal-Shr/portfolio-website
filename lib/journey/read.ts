// No `server-only` here: the CLI scripts (`pnpm journey:new`, `journey:check`) read entries too.
// The app goes through `load.ts`, which is server-only and memoised.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { renderMarkdown } from '../markdown';
import { todayLocal, type Day } from './dates';
import { parseJourneyFile } from './schema';
import { dayOf } from './stats';
import type { JourneyEntry, JourneyMeta } from './types';

export const DEFAULT_JOURNEY_DIR = 'content/journey';

/** `JOURNEY_DIR` points the build at another folder (the e2e fixtures, or a local preview). */
export const journeyDir = (): string => process.env.JOURNEY_DIR || DEFAULT_JOURNEY_DIR;

/** Entry files: `YYYY-MM-DD.md` and any other `.md` (which then fails validation), not the README. */
const isEntryFile = (name: string): boolean =>
  name.endsWith('.md') && name.toLowerCase() !== 'readme.md';

/**
 * Reads and validates every entry in `dir`, newest first. A missing folder means no entries yet,
 * which is a valid state. A malformed entry throws a message naming the file and the field.
 */
export async function readJourney(
  dir: string = journeyDir(),
  today: Day = todayLocal(),
): Promise<JourneyEntry[]> {
  const full = isAbsolute(dir) ? dir : join(process.cwd(), dir);
  if (!existsSync(full)) return [];
  const shown = relative(process.cwd(), full) || '.';

  const parsed = readdirSync(full)
    .filter(isEntryFile)
    .sort()
    .map((name) =>
      parseJourneyFile(readFileSync(join(full, name), 'utf8'), `${shown}/${name}`, today),
    );
  const first = parsed[0]?.fields.date;

  const entries = await Promise.all(
    parsed.map(async ({ fields, body }): Promise<JourneyEntry> => ({
      ...fields,
      slug: fields.date,
      day: first ? dayOf(first, fields.date) : 1,
      // Notes sit under the entry's own heading, so their headings start at h3.
      bodyHtml: body ? await renderMarkdown(body, { headingOffset: 2 }) : null,
    })),
  );
  return entries.reverse();
}

/** What the site tree and the shell need: no HTML. */
export function toMeta(entry: JourneyEntry): JourneyMeta {
  const meta: Partial<JourneyEntry> = { ...entry };
  delete meta.bodyHtml;
  return meta as JourneyMeta;
}
