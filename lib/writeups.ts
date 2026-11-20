import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { renderMarkdown } from './markdown';
import { cleanWriteup } from './writeup-clean';

const Frontmatter = z.object({
  reviewed: z.boolean(),
  draft: z.boolean().optional(),
  sources: z.array(z.string()),
});

export type WriteupKind = 'projects' | 'experience' | 'leadership' | 'achievements' | 'skills';

export type Writeup = {
  /** Sanitized HTML, or `null` when the page should show its placeholder. */
  html: string | null;
  reviewed: boolean;
  sources: string[];
};

const EMPTY: Writeup = { html: null, reviewed: false, sources: [] };

/** Parses one write-up. A malformed file throws with its path, which fails the build. */
export async function parseWriteup(raw: string, path: string): Promise<Writeup> {
  let parsed: ReturnType<typeof matter>;
  try {
    parsed = matter(raw);
  } catch (error) {
    throw new Error(`${path}: could not read frontmatter (${(error as Error).message})`);
  }
  const check = Frontmatter.safeParse(parsed.data);
  if (!check.success) {
    const why = check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`${path}: invalid frontmatter (${why})`);
  }
  const { reviewed, draft, sources } = check.data;
  const body = cleanWriteup(parsed.content);
  return {
    html: draft || !body ? null : await renderMarkdown(body),
    reviewed,
    sources,
  };
}

/** Loads `content/<kind>/<slug>.md`. A missing file is fine: the page shows its placeholder. */
export async function loadWriteup(kind: WriteupKind, slug: string): Promise<Writeup> {
  const relative = `content/${kind}/${slug}.md`;
  const full = join(process.cwd(), relative);
  if (!existsSync(full)) return EMPTY;
  return parseWriteup(readFileSync(full, 'utf8'), relative);
}
