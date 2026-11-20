import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** `false` on the server and during hydration, `true` afterwards. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
