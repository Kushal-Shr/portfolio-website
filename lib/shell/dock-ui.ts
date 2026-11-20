/**
 * Whether the docked command line is expanded on a phone, where it is collapsed behind the nav
 * bar's `>_` button. A tiny store so the button (in the nav) and the dock can share it. Tablets
 * and desktops always show the dock and ignore this.
 */
type Listener = () => void;

let expanded = false;
const listeners = new Set<Listener>();

export const dockUi = {
  get: (): boolean => expanded,
  set(value: boolean): void {
    if (value === expanded) return;
    expanded = value;
    for (const listener of listeners) listener();
  },
  toggle(): void {
    dockUi.set(!expanded);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
