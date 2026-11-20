import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

type State = { started: boolean; count: number };

/**
 * Reveals `total` items one per `intervalMs` after mount. Like `useTypewriter`, the server and
 * first client render show everything (`pending: true` pairs with `data-typing`).
 */
export function useReveal(
  total: number,
  intervalMs: number,
  { step = 1, enabled = true }: { step?: number; enabled?: boolean } = {},
): { count: number; done: boolean; pending: boolean } {
  const [state, setState] = useState<State>({ started: false, count: total });

  useEffect(() => {
    if (!enabled) return;
    // Reads matchMedia directly for the same hydration reason as useTypewriter.
    if (prefersReducedMotion()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with matchMedia
      setState({ started: true, count: total });
      return;
    }
    setState({ started: true, count: 0 });
    let count = 0;
    const id = setInterval(() => {
      count = Math.min(total, count + step);
      setState({ started: true, count });
      if (count >= total) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, step, enabled]);

  if (!enabled) return { count: total, done: true, pending: false };
  if (!state.started) return { count: total, done: true, pending: true };
  return { count: state.count, done: state.count >= total, pending: false };
}
