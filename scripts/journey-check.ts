// `pnpm journey:check`: validates every journey entry (as the build does) and prints the streak.
import { formatDay, toIsoDay, todayLocal } from '../lib/journey/dates';
import { journeyDir, readJourney } from '../lib/journey/read';
import { journeyStats } from '../lib/journey/stats';

const say = (line: string) => process.stdout.write(`${line}\n`);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function main() {
  const today = todayLocal();
  let entries;
  try {
    entries = await readJourney(journeyDir(), today);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  if (entries.length === 0) {
    say(`${journeyDir()}: no entries yet. Start one with: pnpm journey:new`);
    return;
  }
  const dates = entries.map((e) => e.date);
  const { day, streak, longest } = journeyStats(dates, today);
  const todayIso = toIsoDay(today);
  say(`✓ ${plural(entries.length, 'entry', 'entries')} valid`);
  say(
    `day ${day} · streak ${plural(streak, 'day')} · longest ${plural(longest, 'day')} · ${formatDay(today)}`,
  );
  if (!dates.includes(todayIso)) say(`no entry for today yet: pnpm journey:new`);
}

void main();
