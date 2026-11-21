import { useSyncExternalStore } from 'react';

const FRAME_MS = 90;

let frame = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // One interval for every spinner on the page, started by the first and stopped by the last, so
  // two spinners cost one timer and always show the same frame.
  if (listeners.size === 1) {
    timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      frame += 1;
      for (const listener of listeners) listener();
    }, FRAME_MS);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const idle = (): (() => void) => () => {};

/** The current animation frame number, shared by all spinners. `null` while `active` is false. */
export function useSpinnerFrame(active: boolean): number | null {
  const current = useSyncExternalStore(
    active ? subscribe : idle,
    () => frame,
    () => 0,
  );
  return active ? current : null;
}
