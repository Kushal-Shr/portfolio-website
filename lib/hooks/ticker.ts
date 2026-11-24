import { useSyncExternalStore } from 'react';

const idle = (): (() => void) => () => {};

/**
 * A hook that returns a frame number shared by every component using it: one interval for all of
 * them, started by the first subscriber and stopped by the last, and paused while the tab is
 * hidden. The hook returns `null` while `active` is false (and on the server).
 */
export function makeTicker(ms: number): (active: boolean) => number | null {
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<() => void>();

  const subscribe = (onChange: () => void): (() => void) => {
    listeners.add(onChange);
    if (listeners.size === 1) {
      timer = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        frame += 1;
        for (const listener of listeners) listener();
      }, ms);
    }
    return () => {
      listeners.delete(onChange);
      if (listeners.size === 0 && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
  };

  return function useTicker(active: boolean): number | null {
    const current = useSyncExternalStore(
      active ? subscribe : idle,
      () => frame,
      () => 0,
    );
    return active ? current : null;
  };
}
