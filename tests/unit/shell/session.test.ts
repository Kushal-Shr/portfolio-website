import { describe, expect, it } from 'vitest';
import { makeReducer } from '@/lib/shell/reducer';
import {
  finalState,
  MAX_ENTRIES,
  parseSession,
  serializeSession,
  type Action,
  type SessionState,
} from '@/lib/shell/session';
import { ctx, plain } from './helpers';

const reduce = makeReducer(ctx);
const apply = (state: SessionState, ...actions: Action[]) =>
  actions.reduce((s, a) => reduce(s, a), state);
const ready = () => apply(finalState(), { type: 'init', mode: 'final' });
const runs = (...inputs: string[]) => inputs.map((input): Action => ({ type: 'run', input }));

describe('session reducer', () => {
  it('starts as the fully booted shell, the same on server and client', () => {
    const s = finalState();
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0]?.lines).toEqual([{ kind: 'neofetch' }]);
    expect(s.history).toEqual(['neofetch']);
    expect(s.booting).toBe(false);
    expect(s.ready).toBe(false);
  });

  it('boot mode empties the screen and starts the intro', () => {
    const s = apply(finalState(), { type: 'init', mode: 'boot' });
    expect(s).toMatchObject({
      entries: [],
      history: [],
      introTyped: 0,
      booting: true,
      ready: true,
    });
  });

  it('runs a command: echoes it, tracks cwd and prevCwd, and records history', () => {
    const s = apply(ready(), ...runs('cd projects', 'cd ..'));
    expect(s.cwd).toBe('~');
    expect(s.prevCwd).toBe('~/projects');
    expect(s.history).toEqual(['neofetch', 'cd projects', 'cd ..']);
    const last = s.entries.at(-1);
    expect(last).toMatchObject({ input: 'cd ..', cwd: '~/projects' });
  });

  it('supports cd - through prevCwd', () => {
    const s = apply(ready(), ...runs('cd projects', 'cd ~', 'cd -'));
    expect(s.cwd).toBe('~/projects');
  });

  it('echoes an empty line without recording history', () => {
    const before = ready();
    const s = apply(before, { type: 'run', input: '   ' });
    expect(s.entries).toHaveLength(before.entries.length + 1);
    expect(s.history).toEqual(before.history);
  });

  it('clear wipes the screen but keeps history', () => {
    const s = apply(ready(), ...runs('ls', 'clear'));
    expect(s.entries).toEqual([]);
    expect(s.history).toEqual(['neofetch', 'ls', 'clear']);
  });

  it('recalls history with up and down, and ends on an empty draft', () => {
    let s = apply(ready(), ...runs('ls', 'pwd'));
    s = apply(s, { type: 'recall', direction: 'up' });
    expect(s.draft).toBe('pwd');
    s = apply(s, { type: 'recall', direction: 'up' });
    expect(s.draft).toBe('ls');
    s = apply(s, { type: 'recall', direction: 'up' }, { type: 'recall', direction: 'up' });
    expect(s.draft).toBe('neofetch');
    s = apply(s, { type: 'recall', direction: 'down' }, { type: 'recall', direction: 'down' });
    expect(s.draft).toBe('pwd');
    s = apply(s, { type: 'recall', direction: 'down' });
    expect(s.draft).toBe('');
  });

  it('Tab candidates and ^C add output without touching history', () => {
    let s = apply(ready(), { type: 'draft', value: 'c' });
    const history = s.history;
    s = apply(s, { type: 'candidates', items: ['cat', 'cd'] });
    expect(s.history).toEqual(history);
    expect(s.entries.at(-1)).toMatchObject({ input: 'c', record: false });
    expect(plain(s.entries.at(-1)!.lines[0]!)).toBe('cat  cd');
    s = apply(s, { type: 'ctrl-c' });
    expect(s.entries.at(-1)).toMatchObject({ input: 'c^C', record: false });
    expect(s.draft).toBe('');
    expect(s.history).toEqual(history);
  });

  it('stop-boot completes the intro and clears the boot draft', () => {
    let s = apply(finalState(), { type: 'init', mode: 'boot' });
    s = apply(s, { type: 'type-intro', count: 5 }, { type: 'boot-draft', value: 'nef' });
    s = apply(s, { type: 'stop-boot' });
    expect(s).toMatchObject({ booting: false, introTyped: null, draft: '' });
  });

  it('caps the scrollback at 100 entries', () => {
    const s = apply(ready(), ...runs(...Array.from({ length: 130 }, () => 'pwd')));
    expect(s.entries).toHaveLength(MAX_ENTRIES);
    expect(s.entries.at(-1)?.id).toBe(s.nextId - 1);
  });

  it('animates only output created live', () => {
    const s = apply(ready(), { type: 'run', input: 'neofetch', animate: true });
    expect(s.entries.at(-1)?.animate).toBe(true);
    expect(s.entries[0]?.animate).toBeUndefined();
  });
});

describe('session persistence', () => {
  it('round-trips cwd, history and entries (without animation flags)', () => {
    const s = apply(ready(), ...runs('cd projects', 'ls'), {
      type: 'run',
      input: 'neofetch',
      animate: true,
    });
    const saved = parseSession(serializeSession(s));
    expect(saved).toMatchObject({ cwd: '~/projects', prevCwd: '~', history: s.history });
    expect(saved?.entries.some((e) => 'animate' in e)).toBe(false);
    const restored = apply(finalState(), { type: 'init', mode: 'restore', session: saved! });
    expect(restored.cwd).toBe('~/projects');
    expect(restored.entries).toHaveLength(s.entries.length);
    expect(restored.nextId).toBeGreaterThan(Math.max(...restored.entries.map((e) => e.id)));
    expect(restored.ready).toBe(true);
  });

  it('rejects malformed data instead of throwing', () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession('not json')).toBeNull();
    expect(parseSession('{"cwd":"/etc","entries":[],"history":[]}')).toBeNull();
    expect(parseSession('{"cwd":"~","entries":[{"id":"x"}],"history":[]}')).toBeNull();
    expect(parseSession('{"cwd":"~","entries":[],"history":[1]}')).toBeNull();
  });
});
