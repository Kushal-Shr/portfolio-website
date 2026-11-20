/** `<!-- TODO(kushal): … -->` notes, and any other HTML comment. */
const COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Prepares a write-up body for rendering: comments go, and a `##` section whose body is empty
 * is dropped with its heading. Returns `''` when nothing but headings would remain.
 */
export function cleanWriteup(body: string): string {
  const text = body.replace(COMMENT, '');
  const parts = text.split(/^(?=## )/m);
  const kept = parts.filter((part) => {
    const lines = part.split('\n');
    const rest = lines[0]?.startsWith('## ') ? lines.slice(1) : lines;
    return rest.join('\n').trim() !== '';
  });
  return kept.join('').trim();
}

export type OpenQuestion = { file: string; line: number; text: string };

/** Every `TODO(kushal)` comment in a file, with its 1-based line number. */
export function findOpenQuestions(file: string, source: string): OpenQuestion[] {
  const out: OpenQuestion[] = [];
  for (const match of source.matchAll(/<!--\s*TODO\(kushal\):([\s\S]*?)-->/g)) {
    const line = source.slice(0, match.index).split('\n').length;
    out.push({ file, line, text: (match[1] ?? '').trim().replace(/\s+/g, ' ') });
  }
  return out;
}
