'use client';

import Link from 'next/link';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Cursor } from '@/components/terminal/Cursor';
import { useMounted } from '@/lib/hooks/useMounted';
import { prefersReducedMotion } from '@/lib/hooks/useReducedMotion';
import { complete } from '@/lib/shell/complete';
import { finalState, makeReducer, parseSession, serializeSession } from '@/lib/shell/session';
import { BOOTED_KEY, readStorage, SESSION_KEY, writeStorage } from '@/lib/shell/storage';
import type { ShellContext, ShellInfo, VirtualFs } from '@/lib/shell/types';
import { BANNER } from './banner';
import { CHIPS, HINT_COMMANDS } from './copy';
import { Entry, type NeofetchData } from './Entry';

type ShellProps = {
  fs: VirtualFs;
  info: ShellInfo;
  intro: string;
  /** Build-time date; replaced with the visitor's own date after mount. */
  lastLogin: string;
  neofetch: NeofetchData;
};

const BOOT_TICK_MS = 38;

export function Shell({ fs, info, intro, lastLogin, neofetch }: ShellProps) {
  const ctx = useMemo<ShellContext>(() => ({ fs, info, now: () => new Date() }), [fs, info]);
  const reducer = useMemo(() => makeReducer(ctx), [ctx]);
  const [state, dispatch] = useReducer(reducer, undefined, finalState);
  const mounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabStuck = useRef(false);
  const ranBoot = useRef(false);

  const login = useMemo(
    () => (mounted ? new Date().toDateString() : lastLogin),
    [mounted, lastLogin],
  );

  // Decide once, after hydration: ?run= deep link, restored session, plain final state, or boot.
  useEffect(() => {
    if (ranBoot.current) return;
    ranBoot.current = true;
    const params = new URLSearchParams(window.location.search);
    const runParam = params.get('run')?.trim().slice(0, 100);
    const saved = parseSession(readStorage(SESSION_KEY));
    const alreadyBooted = readStorage(BOOTED_KEY) === '1';

    if (runParam) {
      if (saved) dispatch({ type: 'init', mode: 'restore', session: saved });
      else dispatch({ type: 'init', mode: 'final' });
      dispatch({ type: 'run', input: runParam, animate: !prefersReducedMotion() });
      params.delete('run');
      const query = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      );
      writeStorage(BOOTED_KEY, '1');
    } else if (saved) {
      dispatch({ type: 'init', mode: 'restore', session: saved });
    } else if (alreadyBooted || prefersReducedMotion()) {
      dispatch({ type: 'init', mode: 'final' });
      writeStorage(BOOTED_KEY, '1');
    } else {
      dispatch({ type: 'init', mode: 'boot' });
      writeStorage(BOOTED_KEY, '1');
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
        dispatch({ type: 'run', input: target, animate: true });
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

  // Persist the session so leaving for /projects/ and coming back restores the terminal.
  const { ready, booting, entries, cwd, prevCwd, history } = state;
  useEffect(() => {
    if (!ready || booting) return;
    writeStorage(SESSION_KEY, serializeSession({ cwd, prevCwd, entries, history }));
  }, [ready, booting, entries, cwd, prevCwd, history]);

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
    dispatch({ type: 'run', input, animate: !prefersReducedMotion() });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    if (key !== 'Tab') tabStuck.current = false;

    if (key === 'Enter') {
      event.preventDefault();
      run(state.draft);
    } else if (key === 'Tab' && !event.shiftKey) {
      // Never trap keyboard users: with nothing to complete, Tab keeps its normal meaning.
      if (!state.draft.trim()) return;
      const result = complete(state.draft, state, ctx);
      if (result.value !== state.draft) {
        event.preventDefault();
        tabStuck.current = false;
        dispatch({ type: 'draft', value: result.value });
      } else if (result.candidates.length > 0) {
        event.preventDefault();
        if (tabStuck.current) {
          tabStuck.current = false;
          dispatch({ type: 'candidates', items: result.candidates });
        } else {
          tabStuck.current = true;
        }
      }
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
        <span>portfolio-sh — 120×40</span>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-6 py-5"
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
            <span aria-hidden="true">{shownIntro}</span>
            {typingIntro && (state.introTyped ?? 0) < intro.length ? (
              <Cursor className="font-normal" />
            ) : null}
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
            <div className="flex items-center">
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
                className="text-fg caret-green placeholder:text-fg-dim min-h-7 flex-1 border-0 bg-transparent p-0 font-[inherit] outline-none"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-line flex flex-wrap items-center gap-2 border-t px-4 py-2">
        <span className="text-fg-dim text-[13px]">run:</span>
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              run(chip);
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="border-line bg-bg-raised text-fg min-h-11 cursor-pointer border px-3.5 font-[inherit] text-[13px]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
