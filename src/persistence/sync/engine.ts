/**
 * Sync Engine — coordinates local ↔ remote synchronisation.
 *
 * The engine is invisible. It runs on a timer, flushes pending operations,
 * pulls remote changes, and reconciles. The student never sees it work.
 * Like a librarian who reshelves books after midnight.
 */
import { put as localPut, del as localDel } from '../engine';
import { notifyStores } from '../emitter';
import {
  getPendingOps, markSynced, getLastSyncTimestamp, pendingCount,
} from './oplog';
import { getPendingBlobs, markBlobSynced } from './blobQueue';
import { getBlob } from '../repositories/blobs';
import type { SyncAdapter, SyncStatus } from './types';
import type { StoreName } from '../schema';

type StatusListener = (status: SyncStatus) => void;

let adapter: SyncAdapter | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let currentStatus: SyncStatus = {
  state: 'idle',
  pending: 0,
  lastSyncAt: null,
};
const statusListeners = new Set<StatusListener>();

function emitStatus(patch: Partial<SyncStatus>): void {
  currentStatus = { ...currentStatus, ...patch };
  for (const fn of statusListeners) fn(currentStatus);
}

/** Register a sync adapter (call once at app startup). */
export function registerAdapter(a: SyncAdapter): void {
  adapter = a;
}

/** Subscribe to sync status changes. Returns unsubscribe. */
export function onSyncStatus(fn: StatusListener): () => void {
  statusListeners.add(fn);
  fn(currentStatus);
  return () => statusListeners.delete(fn);
}

/** Get current sync status snapshot. */
export function getSyncStatus(): SyncStatus {
  return currentStatus;
}

/** Push pending operations to the server. */
async function flush(): Promise<void> {
  if (!adapter) return;
  const ops = await getPendingOps();
  if (ops.length === 0) return;

  emitStatus({ state: 'syncing', pending: ops.length });

  const confirmedIds = await adapter.pushOperations(ops);
  if (confirmedIds.length > 0) {
    await markSynced(confirmedIds);
  }

  const blobs = await getPendingBlobs();
  for (const b of blobs) {
    const record = await getBlob(b.hash);
    if (record) {
      await adapter.uploadBlob(b.hash, record.data, b.mimeType);
      await markBlobSynced(b.hash);
    }
  }
}

/** Pull remote changes and apply locally. */
async function pull(): Promise<void> {
  if (!adapter) return;
  const since = await getLastSyncTimestamp();
  const remoteOps = await adapter.pullOperations(since ?? 0);

  const affectedStores = new Set<StoreName>();
  for (const op of remoteOps) {
    const storeName = op.store as StoreName;
    if (op.action === 'put' && op.payload) {
      await localPut(storeName, op.payload);
      affectedStores.add(storeName);
    } else if (op.action === 'delete') {
      await localDel(storeName, op.key);
      affectedStores.add(storeName);
    }
  }
  if (affectedStores.size > 0) {
    notifyStores([...affectedStores]);
  }
}

/** Run one full sync cycle: flush then pull. */
export async function sync(): Promise<void> {
  if (!adapter) {
    emitStatus({ state: 'offline' });
    return;
  }

  try {
    const online = await adapter.isOnline();
    if (!online) {
      const pending = await pendingCount();
      emitStatus({ state: 'offline', pending });
      return;
    }

    emitStatus({ state: 'syncing' });
    await flush();
    await pull();
    const remaining = await pendingCount();
    emitStatus({
      state: remaining === 0 ? 'synced' : 'idle',
      pending: remaining,
      lastSyncAt: Date.now(),
      error: undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emitStatus({ state: 'error', error: msg });
  }
}

/** Start the background sync loop. Default: every 30 seconds. */
export function startSync(intervalMs = 30_000): void {
  if (intervalId) return;
  sync();
  intervalId = setInterval(sync, intervalMs);
  window.addEventListener('online', sync);
}

/** Stop the background sync loop. */
export function stopSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  window.removeEventListener('online', sync);
}
