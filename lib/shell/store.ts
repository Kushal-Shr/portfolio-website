import {
  finalState,
  lightReduce,
  parseSession,
  serializeSession,
  withEntry,
  type Action,
  type Entry,
  type SessionState,
} from './session';

export type Reducer = (state: SessionState, action: Action) => SessionState;
export type StorageIo = {
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
};

export const SESSION_KEY = 'psh:session';
export const BOOTED_KEY = 'psh:booted';

/**
 * One shell session shared by the home shell and the dock. A plain external store (no React),
 * read with `useSyncExternalStore`; it persists exactly like the single-page shell did.
 */
export function createShellStore(io: StorageIo) {
  let state: SessionState = finalState();
  let reducer: Reducer | undefined;
  let shellNavigation = false;
  let replaceNext = false;
  const listeners = new Set<() => void>();

  const persist = (prev: SessionState, next: SessionState) => {
    if (!next.ready || next.booting) return;
    if (
      prev.entries === next.entries &&
      prev.history === next.history &&
      prev.cwd === next.cwd &&
      prev.prevCwd === next.prevCwd &&
      prev.booting === next.booting
    ) {
      return;
    }
    io.write(SESSION_KEY, serializeSession(next));
  };

  const set = (next: SessionState) => {
    if (next === state) return;
    const prev = state;
    state = next;
    persist(prev, next);
    for (const l of listeners) l();
  };

  return {
    getState: (): SessionState => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Installs the engine. Until then only engine-free actions apply. */
    configure(next: Reducer): void {
      reducer = next;
    },
    isConfigured: (): boolean => reducer !== undefined,
    dispatch(action: Action): void {
      const next = reducer ? reducer(state, action) : lightReduce(state, action);
      if (next) set(next);
    },
    /** Adds output that is not a command (for example a load failure) to the scrollback. */
    pushEntry(entry: Omit<Entry, 'id'>): void {
      set(withEntry(state, entry));
    },
    /** First use on a page: restore the saved session, or settle on the final state. */
    hydrate(): void {
      if (state.ready) return;
      const saved = parseSession(io.read(SESSION_KEY));
      set(
        lightReduce(
          state,
          saved
            ? { type: 'init', mode: 'restore', session: saved }
            : { type: 'init', mode: 'final' },
        ) ?? state,
      );
    },
    /** Set when the shell itself navigates, so the next page's dock takes focus once. */
    markShellNavigation(): void {
      shellNavigation = true;
    },
    /** The next shell navigation should replace the history entry (`?run=` deep links). */
    setReplaceNext(): void {
      replaceNext = true;
    },
    consumeReplace(): boolean {
      const was = replaceNext;
      replaceNext = false;
      return was;
    },
    consumeShellNavigation(): boolean {
      const was = shellNavigation;
      shellNavigation = false;
      return was;
    },
    readBooted: (): boolean => io.read(BOOTED_KEY) === '1',
    writeBooted(): void {
      io.write(BOOTED_KEY, '1');
    },
    readSaved: () => parseSession(io.read(SESSION_KEY)),
  };
}

export type ShellStore = ReturnType<typeof createShellStore>;

const browserIo: StorageIo = {
  read(key) {
    try {
      return typeof window === 'undefined' ? null : window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value);
    } catch {
      // Storage can be blocked; the shell works without it.
    }
  },
};

export const shellStore: ShellStore = createShellStore(browserIo);
