import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** The server snapshot is `true` so the server never renders an animated state. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
