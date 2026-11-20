import { describe, expect, it, vi } from 'vitest';
import { makeReducer } from '@/lib/shell/reducer';
import { createShellStore, SESSION_KEY, BOOTED_KEY, type StorageIo } from '@/lib/shell/store';
import { ctx } from './helpers';

function memoryIo(
  initial: Record<string, string> = {},
): StorageIo & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    read: (key) => data[key] ?? null,
    write: (key, value) => {
      data[key] = value;
    },
  };
}

const ready = (io = memoryIo()) => {
  const store = createShellStore(io);
  store.configure(makeReducer(ctx));
  store.hydrate();
  return { store, io };
};

describe('shell store', () => {
  it('shares one session between subscribers', () => {
    const { store } = ready();
    const home = vi.fn();
    const dock = vi.fn();
    store.subscribe(home);
    store.subscribe(dock);
    store.dispatch({ type: 'run', input: 'echo hi' });
    expect(home).toHaveBeenCalled();
    expect(dock).toHaveBeenCalled();
    expect(store.getState().entries.at(-1)?.input).toBe('echo hi');
    expect(store.getState()).toBe(store.getState());
  });

  it('stops notifying after unsubscribe', () => {
    const { store } = ready();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.dispatch({ type: 'draft', value: 'x' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('persists commands and restores them in a new store', () => {
    const { store, io } = ready();
    store.dispatch({ type: 'run', input: 'cd projects' });
    store.dispatch({ type: 'run', input: 'echo kept' });
    expect(io.data[SESSION_KEY]).toContain('echo kept');

    const next = createShellStore(io);
    next.hydrate();
    const s = next.getState();
    expect(s.cwd).toBe('~/projects');
    expect(s.history.slice(-2)).toEqual(['cd projects', 'echo kept']);
    expect(s.ready).toBe(true);
  });

  it('does not rewrite storage for draft keystrokes', () => {
    const { store, io } = ready();
    store.dispatch({ type: 'run', input: 'pwd' });
    const writes = vi.spyOn(io, 'write');
    store.dispatch({ type: 'draft', value: 'l' });
    store.dispatch({ type: 'draft', value: 'ls' });
    expect(writes).not.toHaveBeenCalled();
  });

  it('settles on the final state when nothing was saved', () => {
    const store = createShellStore(memoryIo());
    store.hydrate();
    expect(store.getState().ready).toBe(true);
    expect(store.getState().entries[0]?.input).toBe('neofetch');
  });

  it('ignores a malformed saved session', () => {
    const store = createShellStore(memoryIo({ [SESSION_KEY]: '{oops' }));
    store.hydrate();
    expect(store.getState().entries[0]?.input).toBe('neofetch');
  });

  it('syncs the cwd from the URL without the engine installed', () => {
    const store = createShellStore(memoryIo());
    store.hydrate();
    store.dispatch({ type: 'sync-cwd', cwd: '~/projects/zenith' });
    expect(store.getState().cwd).toBe('~/projects/zenith');
    expect(store.getState().prevCwd).toBe('~');
    store.dispatch({ type: 'sync-cwd', cwd: '~/projects/zenith' });
    expect(store.getState().prevCwd).toBe('~');
  });

  it('turns a navigating command into a pending navigation, then clears it', () => {
    const { store } = ready();
    store.dispatch({ type: 'run', input: 'cd projects/zenith' });
    expect(store.getState().pendingNavigation).toBe('/projects/zenith/');
    store.dispatch({ type: 'navigated' });
    expect(store.getState().pendingNavigation).toBeUndefined();
    store.dispatch({ type: 'sync-cwd', cwd: '~/projects/zenith' });
    store.dispatch({ type: 'run', input: 'cd ..' });
    expect(store.getState().pendingNavigation).toBe('/projects/');
  });

  it('records the shell-navigation and replace flags once', () => {
    const { store } = ready();
    expect(store.consumeShellNavigation()).toBe(false);
    store.markShellNavigation();
    expect(store.consumeShellNavigation()).toBe(true);
    expect(store.consumeShellNavigation()).toBe(false);
    store.setReplaceNext();
    expect(store.consumeReplace()).toBe(true);
    expect(store.consumeReplace()).toBe(false);
  });

  it('pushes non-command output without engine or history', () => {
    const store = createShellStore(memoryIo());
    store.hydrate();
    store.pushEntry({ cwd: '~', input: '', lines: [], record: false });
    expect(store.getState().entries.at(-1)?.record).toBe(false);
    expect(store.getState().history).toEqual(['neofetch']);
  });

  it('remembers the boot flag', () => {
    const { store, io } = ready();
    expect(store.readBooted()).toBe(false);
    store.writeBooted();
    expect(io.data[BOOTED_KEY]).toBe('1');
    expect(store.readBooted()).toBe(true);
  });
});
