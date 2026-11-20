import 'server-only';
import { journeyDir, readJourney, toMeta } from './read';
import type { JourneyEntry, JourneyMeta } from './types';

export { DEFAULT_JOURNEY_DIR, journeyDir, readJourney, toMeta } from './read';

const cache = new Map<string, Promise<JourneyEntry[]>>();

/** `readJourney` once per build (and per folder). */
export function loadJourney(dir: string = journeyDir()): Promise<JourneyEntry[]> {
  let entries = cache.get(dir);
  if (!entries) {
    entries = readJourney(dir);
    cache.set(dir, entries);
  }
  return entries;
}

export async function loadJourneyMeta(dir?: string): Promise<JourneyMeta[]> {
  return (await loadJourney(dir)).map(toMeta);
}
