/** One day's fields, as written in the frontmatter (renamed to camelCase). */
export type JourneyFields = {
  date: string;
  learned: string;
  built: string;
  builtLink?: string;
  stuckOn?: string;
  next: string;
  tags: string[];
};

/**
 * What the site tree and the shell get: the fields plus the stable `day` label, no HTML. `day` is
 * days since the first entry + 1, so it never changes when a day is skipped.
 */
export type JourneyMeta = JourneyFields & { slug: string; day: number };

export type JourneyEntry = JourneyMeta & {
  /** Sanitized HTML of the optional notes below the frontmatter, or `null`. */
  bodyHtml: string | null;
};

/** How many entries `/journey` and `ls journey` show before pointing at the archive. */
export const JOURNEY_PAGE_SIZE = 30;
