import { useSyncExternalStore } from 'react';

/**
 * Whether a media query matches. The server and hydration see `serverValue`, then React switches
 * to the real answer, so a page never hydrates with a mismatch.
 */
export function useMatchMedia(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Below Tailwind's `sm` (640px): phones. */
export const PHONE_QUERY = '(max-width: 639px)';
