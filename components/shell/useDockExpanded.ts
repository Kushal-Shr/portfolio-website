'use client';

import { useSyncExternalStore } from 'react';
import { dockUi } from '@/lib/shell/dock-ui';

export function useDockExpanded(): boolean {
  return useSyncExternalStore(dockUi.subscribe, dockUi.get, () => false);
}
