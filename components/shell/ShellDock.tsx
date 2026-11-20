'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Cursor } from '@/components/terminal/Cursor';
import { shellStore } from '@/lib/shell/store';
import { tabStep } from '@/lib/shell/tab';
import { text } from '@/lib/shell/lines';
import type { ShellContext, ShellInfo } from '@/lib/shell/types';
import { loadDock, type DockData } from './dockData';
import { Entry } from './Entry';
import { useShellNavigation } from './useShellNavigation';
import { useShellState } from './useShellState';

const PANEL_ENTRIES = 20;
const LOAD_MESSAGE_DELAY_MS = 200;
const LOAD_ERROR = "portfolio-sh: couldn't load the filesystem — the nav bar below still works";

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
};

/** The docked command line: one line above the nav bar, with an output panel above it. */
export function ShellDock({ info }: { info: ShellInfo }) {
  const state = useShellState();
  const [data, setData] = useState<DockData | undefined>();
  const [draft, setDraft] = useState('');
  const [recall, setRecall] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const tabStuck = useRef(false);

  useShellNavigation(data?.fs);

  /** Starts (or joins) the lazy load; resolves with the data, or `undefined` after printing the error. */
  const ensure = useCallback(async (): Promise<DockData | undefined> => {
    try {
      const loaded = await loadDock();
      // Install the engine right here, not in an effect: `run` dispatches the moment this resolves.
      shellStore.configure(
        loaded.engine.makeReducer({ fs: loaded.fs, info, surface: 'dock', now: () => new Date() }),
      );
      setData(loaded);
      return loaded;
    } catch {
      shellStore.pushEntry({
        cwd: shellStore.getState().cwd,
        input: '',
        lines: [text(LOAD_ERROR, 'err')],
        record: false,
      });
      setOpen(true);
      return undefined;
    }
  }, [info]);

  // Restore the shared session (history, scrollback) and measure the sticky group for scroll-padding.
  useEffect(() => {
    shellStore.hydrate();
    const group = rootRef.current?.closest<HTMLElement>('.dock-group');
    if (!group) return;
    const update = () =>
      document.documentElement.style.setProperty('--dock-h', `${group.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);

  // After a navigation the shell started, the new page's dock takes focus once.
  useEffect(() => {
    if (!shellStore.consumeShellNavigation()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- `ensure` sets state only after the async load
    void ensure();
    inputRef.current?.focus({ preventScroll: true });
  }, [ensure]);

  // `:` or `/` focuses the dock, unless the user is typing somewhere else.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ':' && event.key !== '/') return;
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
      event.preventDefault();
      returnFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      void ensure();
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ensure]);

  const entries = state.entries.slice(-PANEL_ENTRIES);
  useEffect(() => {
    const log = logRef.current;
    if (open && log) log.scrollTop = log.scrollHeight;
  }, [open, state.entries]);

  const run = async (input: string) => {
    setDraft('');
    setRecall(null);
    const timer = setTimeout(() => setLoadingMessage(true), LOAD_MESSAGE_DELAY_MS);
    const loaded = await ensure();
    clearTimeout(timer);
    setLoadingMessage(false);
    if (!loaded) return;
    shellStore.dispatch({ type: 'run', input, surface: 'dock' });
    const last = shellStore.getState().entries.at(-1);
    if (last && last.lines.length > 0) setOpen(true);
  };

  const onKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    if (key !== 'Tab') tabStuck.current = false;

    if (key === 'Enter') {
      event.preventDefault();
      void run(draft);
    } else if (key === 'Tab' && !event.shiftKey) {
      if (!draft.trim()) return;
      // Completion needs the engine; hold the key until it has loaded, as Enter does.
      event.preventDefault();
      const loaded = data ?? (await ensure());
      if (!loaded) return;
      const loadedCtx: ShellContext = {
        fs: loaded.fs,
        info,
        surface: 'dock',
        now: () => new Date(),
      };
      const { step, stuck } = tabStep(
        draft,
        loaded.engine.complete(draft, shellStore.getState(), loadedCtx),
        tabStuck.current,
      );
      tabStuck.current = stuck;
      if (step.kind === 'replace') setDraft(step.value);
      else if (step.kind === 'list') {
        shellStore.dispatch({ type: 'draft', value: draft });
        shellStore.dispatch({ type: 'candidates', items: step.items });
        setOpen(true);
      }
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      const past = shellStore.getState().history;
      if (past.length === 0) return;
      const from = recall ?? past.length;
      const index = key === 'ArrowUp' ? Math.max(0, from - 1) : Math.min(past.length, from + 1);
      setRecall(index);
      setDraft(index < past.length ? (past[index] ?? '') : '');
    } else if (event.ctrlKey && key.toLowerCase() === 'l') {
      event.preventDefault();
      shellStore.dispatch({ type: 'clear' });
    } else if (event.ctrlKey && key.toLowerCase() === 'c') {
      const el = event.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return;
      event.preventDefault();
      shellStore.pushEntry({ cwd: state.cwd, input: `${draft}^C`, lines: [], record: false });
      setDraft('');
      setOpen(true);
    } else if (event.ctrlKey && key.toLowerCase() === 'u') {
      event.preventDefault();
      setDraft('');
    } else if (key === 'Escape') {
      event.preventDefault();
      if (open) {
        setOpen(false);
      } else {
        inputRef.current?.blur();
        returnFocus.current?.focus();
        returnFocus.current = null;
      }
    }
  };

  return (
    <div ref={rootRef} className="dock border-line bg-bg border-t">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div hidden={!open} className="border-line-strong bg-bg relative mt-3 mb-1 border">
          <span className="box-title text-green">
            <span aria-hidden="true">┤ </span>
            portfolio-sh
            <span aria-hidden="true"> ├</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="box-badge text-fg-dim cursor-pointer font-[inherit]"
          >
            [esc] close
          </button>
          <div
            ref={logRef}
            role="log"
            tabIndex={0}
            aria-label="portfolio-sh output"
            aria-live="polite"
            aria-relevant="additions"
            className="flex max-h-[min(40vh,360px)] flex-col gap-3 overflow-y-auto px-4 pt-5 pb-3"
          >
            {entries.map((entry) => (
              <Entry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>

        <div className="flex min-h-11 items-center text-[15px]">
          <label htmlFor="dock-cmd" className="whitespace-pre">
            <span className="sr-only">command line </span>
            <span aria-hidden="true">
              <span className="text-green">guest@portfolio</span>
              <span className="text-fg-dim">:</span>
              <span className="text-blue">{state.cwd}</span>
              <span className="text-fg-dim">$ </span>
            </span>
          </label>
          <div className="relative flex min-h-7 flex-1 items-center">
            <span aria-hidden="true" className="invisible whitespace-pre">
              {draft}
            </span>
            {focused ? <Cursor /> : null}
            {!draft && !focused ? (
              <span aria-hidden="true" className="text-fg-dim absolute left-0">
                <span className="max-sm:hidden">
                  type a command — try: ls · help · press : to focus
                </span>
                <span className="sm:hidden">try: ls · help</span>
              </span>
            ) : null}
            <input
              id="dock-cmd"
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => void onKeyDown(e)}
              onFocus={() => {
                setFocused(true);
                void ensure();
              }}
              onBlur={() => setFocused(false)}
              onPointerEnter={() => void ensure()}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="text-fg absolute inset-0 w-full border-0 bg-transparent p-0 font-[inherit] caret-transparent outline-none"
            />
          </div>
          {loadingMessage ? <span className="text-fg-dim pl-3">loading…</span> : null}
        </div>
      </div>
    </div>
  );
}
