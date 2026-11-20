import { exec } from './exec';
import { lightReduce, MAX_HISTORY, withEntry, type Action, type SessionState } from './session';
import type { Segment, ShellContext } from './types';

export function makeReducer(ctx: ShellContext) {
  return function reduce(state: SessionState, action: Action): SessionState {
    const light = lightReduce(state, action);
    if (light) return light;
    switch (action.type) {
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
          action.surface ? { ...ctx, surface: action.surface } : ctx,
        );
        const history = input ? [...state.history, input].slice(-MAX_HISTORY) : state.history;
        const moved = result.cwd !== state.cwd;
        const next: SessionState = {
          ...base,
          history,
          cwd: result.cwd,
          prevCwd: moved ? state.cwd : state.prevCwd,
          ...(result.navigate ? { pendingNavigation: result.navigate } : {}),
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

      default:
        return state;
    }
  };
}
