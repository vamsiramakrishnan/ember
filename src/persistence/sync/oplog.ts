/**
 * Operation Log — persistent queue of mutations awaiting sync.
 * Stored in its own IndexedDB store. Every local write appends here.
 * The sync engine reads pending ops, pushes them, marks them synced.
 *
 * Note: IndexedDB indexes cannot use boolean keys, so we store
 * synced status as 0 (pending) / 1 (synced) for index queries.
 */
import { openDB } from '../engine';
import { createId } from '../ids';
import { promisify, txDone } from '../idb-utils';
import type { StoreName } from '../schema';
import type { SyncOperation } from './types';

const OPLOG_STORE = 'oplog';

/** Oplog record with numeric synced field for indexing. */
interface OplogRecord extends Omit<SyncOperation, 'synced'> {
  synced: number;
}

/** Ensure the oplog and blob queue stores exist (called during DB setup). */
export function createOplogStores(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(OPLOG_STORE)) {
    const store = db.createObjectStore(OPLOG_STORE, { keyPath: 'id' });
    store.createIndex('by-synced', 'synced');
    store.createIndex('by-timestamp', 'timestamp');
  }
  if (!db.objectStoreNames.contains('blob_queue')) {
    const store = db.createObjectStore('blob_queue', { keyPath: 'hash' });
    store.createIndex('by-synced', 'synced');
  }
}


function toSyncOp(rec: OplogRecord): SyncOperation {
  return { ...rec, synced: rec.synced === 1 };
}

/** Record a mutation in the oplog. */
export async function recordOp(
  store: StoreName, action: 'put' | 'delete',
  key: string, payload?: unknown,
): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return;
  const rec: OplogRecord = {
    id: createId(), store, action, key, payload,
    timestamp: Date.now(), synced: 0,
  };
  const tx = db.transaction(OPLOG_STORE, 'readwrite');
  tx.objectStore(OPLOG_STORE).put(rec);
  await txDone(tx);
}

/** Record multiple mutations in a single IDB transaction. */
export async function recordOpBatch(
  ops: ReadonlyArray<{
    store: StoreName;
    action: 'put' | 'delete';
    key: string;
    payload?: unknown;
  }>,
): Promise<void> {
  if (ops.length === 0) return;
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return;
  const tx = db.transaction(OPLOG_STORE, 'readwrite');
  const objStore = tx.objectStore(OPLOG_STORE);
  const now = Date.now();
  for (const op of ops) {
    const rec: OplogRecord = {
      id: createId(),
      store: op.store,
      action: op.action,
      key: op.key,
      payload: op.payload,
      timestamp: now,
      synced: 0,
    };
    objStore.put(rec);
  }
  await txDone(tx);
}

/** Get all pending (unsynced) operations, ordered by timestamp. */
export async function getPendingOps(): Promise<SyncOperation[]> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return [];
  const tx = db.transaction(OPLOG_STORE, 'readonly');
  const index = tx.objectStore(OPLOG_STORE).index('by-synced');
  const recs = await promisify<OplogRecord[]>(index.getAll(0));
  return recs.sort((a, b) => a.timestamp - b.timestamp).map(toSyncOp);
}

/** Mark operations as synced by their IDs, then compact old synced ops. */
export async function markSynced(ids: string[]): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return;
  const tx = db.transaction(OPLOG_STORE, 'readwrite');
  const store = tx.objectStore(OPLOG_STORE);
  for (const id of ids) {
    const req = store.get(id);
    req.onsuccess = () => {
      const rec = req.result as OplogRecord | undefined;
      if (rec) store.put({ ...rec, synced: 1 });
    };
  }
  await txDone(tx);

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  await compactOplog(SEVEN_DAYS_MS);
}

/** Count pending operations. */
export async function pendingCount(): Promise<number> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return 0;
  const tx = db.transaction(OPLOG_STORE, 'readonly');
  const index = tx.objectStore(OPLOG_STORE).index('by-synced');
  return promisify<number>(index.count(0));
}

/** Delete all synced ops older than the given age in milliseconds. */
export async function compactOplog(olderThanMs: number): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return;
  const cutoff = Date.now() - olderThanMs;
  const tx = db.transaction(OPLOG_STORE, 'readwrite');
  const objStore = tx.objectStore(OPLOG_STORE);
  const index = objStore.index('by-synced');
  const recs = await promisify<OplogRecord[]>(index.getAll(1));
  for (const rec of recs) {
    if (rec.timestamp < cutoff) {
      objStore.delete(rec.id);
    }
  }
  await txDone(tx);
}

/** Get the latest sync timestamp (most recent synced operation). */
export async function getLastSyncTimestamp(): Promise<number | null> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(OPLOG_STORE)) return null;
  const tx = db.transaction(OPLOG_STORE, 'readonly');
  const index = tx.objectStore(OPLOG_STORE).index('by-timestamp');
  const cursor = index.openCursor(null, 'prev');
  return new Promise((resolve) => {
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c && (c.value as OplogRecord).synced === 1) {
        resolve((c.value as OplogRecord).timestamp);
      } else { resolve(null); }
    };
    cursor.onerror = () => resolve(null);
  });
}
