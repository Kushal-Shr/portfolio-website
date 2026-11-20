import { exec } from './exec';
import type { Line, Segment, ShellContext } from './types';

export type Entry = {
  id: number;
  cwd: string;
  input: string;
  lines: Line[];
  /** The neofetch portrait reveals line by line, only for output created live. */
  animate?: boolean;
  /** `false` for echoes that are not commands (Tab candidates, ^C): kept out of history. */
  record?: boolean;
};

export type SessionState = {
  cwd: string;
  prevCwd?: string;
  entries: Entry[];
  history: string[];
  draft: string;
  recallIndex: number | null;
  nextId: number;
  /** Characters of the intro typed so far, or `null` once it is complete. */
  introTyped: number | null;
  booting: boolean;
  /** False until the client has decided between boot, restore and the final state. */
  ready: boolean;
};

export type Action =
  | { type: 'init'; mode: 'boot' }
  | { type: 'init'; mode: 'final' }
  | { type: 'init'; mode: 'restore'; session: SavedSession }
  | { type: 'type-intro'; count: number }
  | { type: 'boot-draft'; value: string }
  | { type: 'stop-boot' }
  | { type: 'run'; input: string; animate?: boolean }
  | { type: 'draft'; value: string }
  | { type: 'recall'; direction: 'up' | 'down' }
  | { type: 'candidates'; items: string[] }
  | { type: 'ctrl-c' }
  | { type: 'clear' };

export const MAX_ENTRIES = 100;
export const MAX_HISTORY = 200;

/** What the server renders (and what no-JS users see): the fully booted shell. */
export function finalState(): SessionState {
  return {
    cwd: '~',
    entries: [{ id: 1, cwd: '~', input: 'neofetch', lines: [{ kind: 'neofetch' }] }],
    history: ['neofetch'],
    draft: '',
    recallIndex: null,
    nextId: 2,
    introTyped: null,
    booting: false,
    ready: false,
  };
}

const withEntry = (state: SessionState, entry: Omit<Entry, 'id'>): SessionState => ({
  ...state,
  entries: [...state.entries, { ...entry, id: state.nextId }].slice(-MAX_ENTRIES),
  nextId: state.nextId + 1,
});

export function makeReducer(ctx: ShellContext) {
  return function reduce(state: SessionState, action: Action): SessionState {
    switch (action.type) {
      case 'init': {
        if (action.mode === 'boot') {
          return {
            ...state,
            entries: [],
            history: [],
            introTyped: 0,
            booting: true,
            ready: true,
          };
        }
        if (action.mode === 'restore') {
          const s = action.session;
          const next = { ...state, ...s, ready: true };
          return { ...next, nextId: Math.max(0, ...s.entries.map((e) => e.id)) + 1 };
        }
        return { ...state, ready: true };
      }

      case 'type-intro':
        return { ...state, introTyped: action.count };

      case 'boot-draft':
        return { ...state, draft: action.value };

      case 'stop-boot':
        return state.booting ? { ...state, booting: false, introTyped: null, draft: '' } : state;

      case 'draft':
        return { ...state, draft: action.value };

      case 'run': {
        const input = action.input.trim();
        const base = { ...state, booting: false, introTyped: null, draft: '', recallIndex: null };
        const result = exec(
          input,
          { cwd: state.cwd, prevCwd: state.prevCwd, history: state.history },
          ctx,
        );
        const history = input ? [...state.history, input].slice(-MAX_HISTORY) : state.history;
        const moved = result.cwd !== state.cwd;
        const next: SessionState = {
          ...base,
          history,
          cwd: result.cwd,
          prevCwd: moved ? state.cwd : state.prevCwd,
        };
        if (result.clear) return { ...next, entries: [] };
        return withEntry(next, {
          cwd: state.cwd,
          input,
          lines: result.lines,
          ...(action.animate ? { animate: true } : {}),
        });
      }

      case 'recall': {
        const past = state.history;
        if (past.length === 0) return state;
        const from = state.recallIndex ?? past.length;
        const index =
          action.direction === 'up' ? Math.max(0, from - 1) : Math.min(past.length, from + 1);
        return {
          ...state,
          recallIndex: index,
          draft: index < past.length ? (past[index] ?? '') : '',
        };
      }

      case 'candidates': {
        const items: Segment[] = action.items.map((name) =>
          name.endsWith('/') ? { text: name, tone: 'dir', bold: true } : { text: name },
        );
        return withEntry(state, {
          cwd: state.cwd,
          input: state.draft,
          lines: [{ kind: 'items', items }],
          record: false,
        });
      }

      case 'ctrl-c':
        return {
          ...withEntry(state, {
            cwd: state.cwd,
            input: `${state.draft}^C`,
            lines: [],
            record: false,
          }),
          draft: '',
          recallIndex: null,
        };

      case 'clear':
        return { ...state, entries: [] };
    }
  };
}

export type SavedSession = Pick<SessionState, 'cwd' | 'prevCwd' | 'entries' | 'history'>;

export function serializeSession(state: SavedSession): string {
  const session: SavedSession = {
    cwd: state.cwd,
    ...(state.prevCwd ? { prevCwd: state.prevCwd } : {}),
    entries: state.entries.slice(-MAX_ENTRIES).map((e) => ({
      id: e.id,
      cwd: e.cwd,
      input: e.input,
      lines: e.lines,
      ...(e.record === false ? { record: false } : {}),
    })),
    history: state.history.slice(-MAX_HISTORY),
  };
  return JSON.stringify(session);
}

/** Parses a saved session defensively: anything malformed means "start fresh". */
export function parseSession(raw: string | null): SavedSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedSession>;
    if (typeof data.cwd !== 'string' || !data.cwd.startsWith('~')) return null;
    if (!Array.isArray(data.entries) || !Array.isArray(data.history)) return null;
    const valid = data.entries.every(
      (e) =>
        typeof e?.id === 'number' &&
        typeof e.cwd === 'string' &&
        typeof e.input === 'string' &&
        Array.isArray(e.lines),
    );
    if (!valid || !data.history.every((h) => typeof h === 'string')) return null;
    return {
      cwd: data.cwd,
      ...(typeof data.prevCwd === 'string' ? { prevCwd: data.prevCwd } : {}),
      entries: data.entries,
      history: data.history,
    };
  } catch {
    return null;
  }
}
