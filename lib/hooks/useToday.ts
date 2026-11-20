import { useSyncExternalStore } from 'react';
import { toIsoDay, todayLocal } from '@/lib/journey/dates';

const read = (): string => toIsoDay(todayLocal());

// A tab left open overnight picks up the new day when the viewer comes back to it.
function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('focus', onChange);
  };
}

/**
 * The viewer's calendar date (`YYYY-MM-DD`). The server and hydration render `buildDay` (the
 * day the static site was built), then React switches to the viewer's own date, with no mismatch.
 */
export function useToday(buildDay: string): string {
  return useSyncExternalStore(subscribe, read, () => buildDay);
}
