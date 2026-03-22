/**
 * useSyncStatus — React hook for the quiet sync indicator.
 * Returns the current sync state so the Footer can show
 * an almost-invisible dot that shifts colour.
 */
import { useState, useEffect } from 'react';
import { onSyncStatus, getSyncStatus } from './engine';
import type { SyncStatus } from './types';

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);

  useEffect(() => {
    return onSyncStatus(setStatus);
  }, []);

  return status;
}
