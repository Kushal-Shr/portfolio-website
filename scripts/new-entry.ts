// `pnpm journey:new [--date YYYY-MM-DD]`: creates today's (local) journey entry from the template.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { addDays, dayNumber, toIsoDay, todayLocal, tryParseDay } from '../lib/journey/dates';
import { journeyDir } from '../lib/journey/read';
import { dayOf } from '../lib/journey/stats';

const say = (line: string) => process.stdout.write(`${line}\n`);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

function dateArg(argv: string[]): string {
  const i = argv.findIndex((a) => a === '--date' || a.startsWith('--date='));
  if (i === -1) return toIsoDay(todayLocal());
  const value = argv[i]?.includes('=') ? argv[i]?.split('=')[1] : argv[i + 1];
  const day = value ? tryParseDay(value) : undefined;
  if (!day)
    return fail(
      `journey:new: --date wants a calendar date, YYYY-MM-DD (got ${value ?? 'nothing'})`,
    );
  if (dayNumber(day) > dayNumber(addDays(todayLocal(), 1))) {
    return fail(`journey:new: ${value} is in the future; the build would reject it`);
  }
  return toIsoDay(day);
}

export function template(date: string): string {
  return `---
date: ${date}
learned: ""      # what clicked today: a concept, a bug, a trick
built: ""        # what you shipped or wrote
built_link: ""   # optional: an https:// link to it
stuck_on: ""     # optional: what is still fuzzy (honesty makes the log interesting)
next: ""         # tomorrow's one thing
tags: []         # optional: lowercase, e.g. [airflow, nextjs]
---

`;
}

async function main() {
  const date = dateArg(process.argv.slice(2));
  const dir = join(process.cwd(), journeyDir());
  const file = join(dir, `${date}.md`);
  const shown = relative(process.cwd(), file);

  if (existsSync(file)) {
    say(`journey:new: ${shown} already exists, not overwriting it.`);
    say(shown);
    process.exit(1);
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, template(date));

  const dates = readdirSync(dir)
    .map((name) => name.replace(/\.md$/, ''))
    .filter((stem) => tryParseDay(stem))
    .sort();
  const day = dayOf(dates[0] ?? date, date);

  say(`created ${shown}`);
  say(`\nnext: fill it in → pnpm check → git commit -m "journey: day ${day}" → push`);

  const editor = process.env.EDITOR;
  if (editor && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question(`open it in ${editor}? [Y/n] `)).trim().toLowerCase();
    rl.close();
    if (answer === '' || answer === 'y' || answer === 'yes') {
      spawnSync(editor, [file], { stdio: 'inherit', shell: true });
    }
  }
}

void main();
