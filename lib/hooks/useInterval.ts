import { useEffect, useRef } from 'react';

/** Calls `callback` every `delayMs`. `null` pauses it, and it also pauses in hidden tabs. */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id === null) id = setInterval(() => saved.current(), delayMs);
    };
    const stop = () => {
      if (id !== null) clearInterval(id);
      id = null;
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : start());

    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [delayMs]);
}
