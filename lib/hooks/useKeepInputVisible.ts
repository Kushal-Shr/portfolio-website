import { useEffect, type RefObject } from 'react';

/**
 * Keeps a focused input above the software keyboard. The keyboard shrinks the *visual* viewport
 * (not the layout one), so while the input has focus every resize of it scrolls the input back
 * into view.
 */
export function useKeepInputVisible(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const input = ref.current;
    const viewport = window.visualViewport;
    if (!input || !viewport) return;
    const onResize = () => {
      if (document.activeElement === input) input.scrollIntoView({ block: 'nearest' });
    };
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }, [ref]);
}
