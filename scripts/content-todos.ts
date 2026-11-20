// A checklist for Kushal: remaining `todo(...)` placeholders in content/*.ts, write-ups that
// are not reviewed yet, and every open TODO(kushal) question in the Markdown files.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import * as content from '../content/index';
import { isTodo } from '../content/types';
import { walk } from '../lib/content-walk';
import { findOpenQuestions, type OpenQuestion } from '../lib/writeup-clean';

const root = process.cwd();
const out: string[] = [];

const found: { path: string; text: string }[] = [];
for (const [name, value] of Object.entries(content)) {
  if (typeof value === 'function') continue;
  walk(value, name, (node, path) => {
    if (isTodo(node)) found.push({ path, text: node.text });
  });
}
out.push(
  found.length
    ? `${found.length} placeholder(s) in content/*.ts:`
    : 'No placeholders in content/*.ts.',
  ...found.map((f) => `  ${f.path}\n    ${f.text}`),
);

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return markdownFiles(full);
    return name.endsWith('.md') && name !== 'README.md' ? [full] : [];
  });
}

const unreviewed: string[] = [];
const questions: OpenQuestion[] = [];
for (const file of markdownFiles(join(root, 'content')).sort()) {
  const source = readFileSync(file, 'utf8');
  const path = relative(root, file);
  if (matter(source).data.reviewed !== true) unreviewed.push(path);
  questions.push(...findOpenQuestions(path, source));
}

out.push(
  '',
  `${unreviewed.length} write-up(s) not reviewed yet (set reviewed: true once you have read them):`,
  ...unreviewed.map((f) => `  ${f}`),
  '',
  `${questions.length} open TODO(kushal) question(s):`,
  ...questions.map((q) => `  ${q.file}:${q.line}\n    ${q.text}`),
);

process.stdout.write(out.join('\n') + '\n');
