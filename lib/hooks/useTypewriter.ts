import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

type Options = { speed: number; startDelay?: number; enabled?: boolean };
type State = { text: string; started: boolean; count: number };

/**
 * Types `text` one character at a time after mount.
 *
 * The server and the first client render return the full text with `pending: true`, so the
 * HTML is complete without JS. Pair `pending` with `data-typing` to hide it until typing starts.
 */
export function useTypewriter(
  text: string,
  { speed, startDelay = 0, enabled = true }: Options,
): { shown: string; done: boolean; pending: boolean } {
  const [state, setState] = useState<State>({ text, started: false, count: text.length });

  useEffect(() => {
    // Read the preference directly: the hook's server snapshot (`true`) would otherwise make the
    // effect run once in "reduced" mode during hydration and flash the full text.
    if (!enabled || prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with matchMedia, which is unreadable during render without a hydration mismatch
      setState({ text, started: true, count: text.length });
      return;
    }

    setState({ text, started: true, count: 0 });
    let count = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        count += 1;
        setState({ text, started: true, count });
        if (count >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, startDelay, enabled]);

  // A stale state (text just changed, effect not yet run) counts as pending with the full text.
  if (!state.started || state.text !== text) {
    return { shown: text, done: true, pending: true };
  }
  return {
    shown: text.slice(0, state.count),
    done: state.count >= text.length,
    pending: false,
  };
}
