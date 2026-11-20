// Lists every remaining `todo(...)` placeholder in content/, so Kushal has a checklist.
import * as content from '../content/index';
import { isTodo } from '../content/types';
import { walk } from '../lib/content-walk';

const found: { path: string; text: string }[] = [];
for (const [name, value] of Object.entries(content)) {
  if (typeof value === 'function') continue;
  walk(value, name, (node, path) => {
    if (isTodo(node)) found.push({ path, text: node.text });
  });
}

const out = found.length
  ? [
      `${found.length} placeholder(s) left to fill in:`,
      ...found.map((f) => `  ${f.path}\n    ${f.text}`),
    ]
  : ['No placeholders left.'];
process.stdout.write(out.join('\n') + '\n');
