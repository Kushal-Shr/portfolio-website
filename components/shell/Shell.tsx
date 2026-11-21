'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { TypedChars } from '@/components/terminal/TypedChars';
import { useKeepInputVisible } from '@/lib/hooks/useKeepInputVisible';
import { useMounted } from '@/lib/hooks/useMounted';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useScrollFade } from '@/lib/hooks/useScrollFade';
import { complete } from '@/lib/shell/complete';
import { makeReducer } from '@/lib/shell/reducer';
import { shellStore } from '@/lib/shell/store';
import { tabStep } from '@/lib/shell/tab';
import type { ShellContext, ShellInfo, VirtualFs } from '@/lib/shell/types';
import { BANNER } from './banner';
import { CHIPS, HINT_COMMANDS } from './copy';
import { Entry, type NeofetchData } from './Entry';
import { useShellNavigation } from './useShellNavigation';
import { useShellState } from './useShellState';

type ShellProps = {
  fs: VirtualFs;
  info: ShellInfo;
  intro: string;
  /** Build-time date; replaced with the visitor's own date after mount. */
  lastLogin: string;
  neofetch: NeofetchData;
};

const BOOT_TICK_MS = 38;
const dispatch = shellStore.dispatch;

export function Shell({ fs, info, intro, lastLogin, neofetch }: ShellProps) {
  const ctx = useMemo<ShellContext>(
    () => ({ fs, info, surface: 'home', now: () => new Date() }),
    [fs, info],
  );
  const state = useShellState();
  const mounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const tabStuck = useRef(false);
  const ranInit = useRef(false);

  useShellNavigation(fs);
  useKeepInputVisible(inputRef);
  useScrollFade(chipsRef);

  const login = useMemo(
    () => (mounted ? new Date().toDateString() : lastLogin),
    [mounted, lastLogin],
  );

  useEffect(() => {
    shellStore.configure(makeReducer(ctx));
  }, [ctx]);

  // Decide once, after hydration: ?run= deep link, the live session, a saved one, or the boot.
  useEffect(() => {
    if (ranInit.current) return;
    ranInit.current = true;
    const params = new URLSearchParams(window.location.search);
    const runParam = params.get('run')?.trim().slice(0, 100);
    const saved = shellStore.readSaved();
    const booted = shellStore.readBooted();
    const live = shellStore.getState().ready && (booted || saved !== null);

    if (runParam) {
      if (!live) {
        dispatch(
          saved
            ? { type: 'init', mode: 'restore', session: saved }
            : { type: 'init', mode: 'final' },
        );
      }
      shellStore.setReplaceNext();
      dispatch({ type: 'run', input: runParam, animate: !prefersReducedMotion(), surface: 'home' });
      params.delete('run');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
      shellStore.writeBooted();
    } else if (live) {
      // Already running in this tab (we came back from another page): keep it as it is.
    } else if (saved) {
      dispatch({ type: 'init', mode: 'restore', session: saved });
    } else if (booted || prefersReducedMotion()) {
      dispatch({ type: 'init', mode: 'final' });
      shellStore.writeBooted();
    } else {
      dispatch({ type: 'init', mode: 'boot' });
      shellStore.writeBooted();
    }
  }, []);

  // The boot timer, ported from the design: type the intro, pause, type `neofetch`, run it.
  useEffect(() => {
    if (!state.booting) return;
    let typed = 0;
    let pause = 0;
    let draftLength = 0;
    const target = 'neofetch';
    const id = setInterval(() => {
      if (typed < intro.length) {
        typed += 1;
        dispatch({ type: 'type-intro', count: typed });
        return;
      }
      if (typed === intro.length) {
        typed += 1;
        dispatch({ type: 'type-intro', count: intro.length });
      }
      pause += 1;
      if (pause < 14) return;
      if (draftLength < target.length) {
        if (pause % 3 === 0) {
          draftLength += 1;
          dispatch({ type: 'boot-draft', value: target.slice(0, draftLength) });
        }
        return;
      }
      if (pause > 46) {
        clearInterval(id);
        dispatch({ type: 'run', input: target, animate: true, surface: 'home' });
      }
    }, BOOT_TICK_MS);
    return () => clearInterval(id);
  }, [state.booting, intro]);

  // A keystroke anywhere ends the boot; the input takes focus so the key still lands in it.
  useEffect(() => {
    if (!state.booting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.metaKey || event.ctrlKey || event.altKey) return;
      dispatch({ type: 'stop-boot' });
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.booting]);

  // Keep the newest output in view after each command (column-reverse: scrollTop 0 is the bottom).
  const entryCount = state.entries.length;
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [entryCount]);

  // Focus the input once the shell is ready, but only where a keyboard pops up for free.
  useEffect(() => {
    if (!state.ready || state.booting) return;
    if (window.matchMedia('(pointer: fine)').matches)
      inputRef.current?.focus({ preventScroll: true });
  }, [state.ready, state.booting]);

  const skipBoot = () => {
    if (state.booting) dispatch({ type: 'stop-boot' });
  };

  const run = (input: string) => {
    dispatch({ type: 'run', input, animate: !prefersReducedMotion(), surface: 'home' });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    if (key !== 'Tab') tabStuck.current = false;

    if (key === 'Enter') {
      event.preventDefault();
      run(state.draft);
    } else if (key === 'Tab' && !event.shiftKey) {
      const { step, stuck } = tabStep(
        state.draft,
        complete(state.draft, state, ctx),
        tabStuck.current,
      );
      tabStuck.current = stuck;
      if (step.kind === 'native') return;
      event.preventDefault();
      if (step.kind === 'replace') dispatch({ type: 'draft', value: step.value });
      else if (step.kind === 'list') dispatch({ type: 'candidates', items: step.items });
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      dispatch({ type: 'recall', direction: key === 'ArrowUp' ? 'up' : 'down' });
    } else if (event.ctrlKey && key.toLowerCase() === 'l') {
      event.preventDefault();
      dispatch({ type: 'clear' });
    } else if (event.ctrlKey && key.toLowerCase() === 'c') {
      const el = event.currentTarget;
      if (el.selectionStart === el.selectionEnd) {
        event.preventDefault();
        dispatch({ type: 'ctrl-c' });
      }
    } else if ((event.ctrlKey && key.toLowerCase() === 'u') || key === 'Escape') {
      event.preventDefault();
      dispatch({ type: 'draft', value: '' });
    }
  };

  const typingIntro = state.introTyped !== null;
  const shownIntro = typingIntro ? intro.slice(0, state.introTyped ?? 0) : intro;
  const showPrompt = !typingIntro || (state.introTyped ?? 0) >= intro.length;
  const booted = !state.booting;

  return (
    <div
      className="border-line flex min-h-0 flex-1 flex-col border"
      onKeyDownCapture={skipBoot}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest('a, button')) skipBoot();
      }}
    >
      <div className="border-line text-fg-dim flex justify-between border-b px-4 py-2 text-[13px]">
        <span>guest@portfolio: {state.cwd}</span>
        <span className="max-sm:hidden">portfolio-sh — 120×40</span>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-4 py-5 sm:px-6"
        onClick={(e) => {
          if (window.getSelection()?.toString()) return;
          if ((e.target as HTMLElement).closest('a, button, input')) return;
          inputRef.current?.focus({ preventScroll: true });
        }}
      >
        <div data-typing={state.ready ? undefined : 'pending'} className="flex flex-col gap-3.5">
          <pre aria-hidden="true" className="text-green leading-[1.2]">
            {BANNER}
          </pre>
          <p className="text-fg-dim">Last login: {login} on ttys001</p>
          <h1 aria-label={intro} className="m-0 text-[15px] font-bold whitespace-pre-wrap">
            <span aria-hidden="true">
              <TypedChars
                text={intro}
                count={shownIntro.length}
                cursor={typingIntro && (state.introTyped ?? 0) < intro.length}
                cursorClassName="font-normal"
              />
            </span>
          </h1>

          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex flex-col gap-3.5"
          >
            {state.entries.map((entry) => (
              <Entry key={entry.id} entry={entry} neofetch={neofetch} />
            ))}
          </div>

          {booted ? (
            <p id="shell-hint" className="text-fg-dim">
              it&apos;s a real-ish shell: try{' '}
              {HINT_COMMANDS.map((cmd, i) => (
                <span key={cmd}>
                  <span className="text-green">{cmd}</span>
                  {i < HINT_COMMANDS.length - 2
                    ? ', '
                    : i === HINT_COMMANDS.length - 2
                      ? ' or '
                      : ''}
                </span>
              ))}{' '}
              · Tab completes · ↑ recalls · new to terminals?{' '}
              <Link href="/guide/">read the guide</Link>
            </p>
          ) : null}
          <noscript>
            <p className="text-fg-dim">
              JavaScript is off, so this shell is read-only. The nav bar below works without it.
            </p>
          </noscript>

          {showPrompt ? (
            <div className="flex items-center max-sm:text-[16px]">
              <label htmlFor="cmd" className="whitespace-pre">
                <span className="text-green">guest@portfolio</span>
                <span className="text-fg-dim">:</span>
                <span className="text-blue">{state.cwd}</span>
                <span className="text-fg-dim">$ </span>
              </label>
              <input
                id="cmd"
                ref={inputRef}
                type="text"
                value={state.draft}
                disabled={!mounted}
                onChange={(e) => dispatch({ type: 'draft', value: e.target.value })}
                onKeyDown={onKeyDown}
                placeholder="type a command…"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                aria-describedby="shell-hint"
                data-dense=""
                className="text-fg caret-green placeholder:text-fg-dim min-h-7 flex-1 border-0 bg-transparent p-0 font-[inherit] outline-none max-lg:min-h-11 pointer-coarse:min-h-11"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* A phone's main way in: one row that scrolls sideways, with the first few chips in view. */}
      <div
        ref={chipsRef}
        data-scroll-x=""
        className="border-line flex scrollbar-none items-center gap-2 border-t px-4 py-2 max-sm:flex-nowrap max-sm:overflow-x-auto sm:flex-wrap"
      >
        <span className="text-fg-dim flex-none text-[13px] max-[359px]:hidden">run:</span>
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              run(chip);
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="border-line bg-bg-raised text-fg min-h-11 min-w-11 flex-none cursor-pointer border px-3.5 font-[inherit] text-[13px]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
