import { useEffect, type RefObject } from 'react';

type Options = {
  /**
   * When the content really overflows, the box becomes a keyboard-scrollable `region` with this
   * name (axe's `scrollable-region-focusable`). Left off for boxes that already hold focusable
   * children, like the nav bar and chip rows.
   */
  label?: string;
};

/**
 * Marks which edges of a horizontally scrolling box have more content (`data-fade`, styled in
 * globals.css) and, with a `label`, makes it focusable only while it actually overflows. Works on
 * the DOM directly, so scrolling never re-renders React.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>, { label }: Options = {}): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const overflows = max > 1;
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= max - 1;
      const fade =
        !overflows || (atStart && atEnd) ? '' : atStart ? 'end' : atEnd ? 'start' : 'both';
      if (fade) el.dataset.fade = fade;
      else delete el.dataset.fade;

      if (!label) return;
      if (overflows) {
        el.tabIndex = 0;
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', label);
      } else {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
      }
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    // The box changes size with the window; its content with fonts loading and filters.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [ref, label]);
}
