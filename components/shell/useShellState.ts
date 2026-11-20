'use client';

import { useSyncExternalStore } from 'react';
import { finalState, type SessionState } from '@/lib/shell/session';
import { shellStore } from '@/lib/shell/store';

// The server and the first client render both see the fully booted shell.
const SERVER_STATE = finalState();

export function useShellState(): SessionState {
  return useSyncExternalStore(shellStore.subscribe, shellStore.getState, () => SERVER_STATE);
}
