/**
 * CRDT-aware reactive writes.
 *
 * Replaces `reactivePut` / `reactiveDel` for notebook-scoped data.
 * Instead of writing to IDB + recording in the oplog, writes go through
 * the Y.Doc. The bridge observer (bridge.ts) handles IDB persistence
 * and React notifications automatically.
 *
 * This is the only write path for CRDT-managed stores. Direct IDB writes
 * bypass conflict resolution and will be overwritten on next sync.
 */
import type { StoreName } from '../schema';
import { getDoc, getStoreMap, getEventsArray, MAP_STORES, EVENTS_STORE } from './doc';
import { isBridgeWriting } from './bridge';

/** Stores managed by the CRDT layer (excludes students, notebooks, blobs). */
const CRDT_STORES = new Set<StoreName>([
  ...MAP_STORES,
  EVENTS_STORE,
]);

/** Validate that a store is CRDT-managed. */
function assertCRDTStore(store: StoreName): void {
  if (!CRDT_STORES.has(store)) {
    throw new Error(
      `Store "${store}" is not managed by the CRDT layer. ` +
      `Use reactivePut() for non-notebook-scoped stores.`,
    );
  }
}

/**
 * Put a record through the CRDT layer.
 *
 * The record must have an `id` field (or `hash` for blobs — but blobs
 * are not CRDT-managed). The write goes into the Y.Doc, and the bridge
 * observer writes it to IDB and notifies React.
 */
export function crdtPut<T extends { id: string }>(
  notebookId: string,
  store: StoreName,
  record: T,
): void {
  assertCRDTStore(store);

  // Prevent echo loops: if the bridge is currently writing from Y.Doc
  // to IDB, don't write back into Y.Doc.
  if (isBridgeWriting(notebookId)) return;

  const doc = getDoc(notebookId);

  if (store === EVENTS_STORE) {
    const arr = getEventsArray(notebookId);
    doc.transact(() => {
      arr.push([record]);
    });
    return;
  }

  const ymap = getStoreMap(notebookId, store);
  doc.transact(() => {
    ymap.set(record.id, record);
  });
}

/**
 * Delete a record through the CRDT layer.
 *
 * Only works for Y.Map stores (not events, which are append-only).
 */
export function crdtDel(
  notebookId: string,
  store: StoreName,
  key: string,
): void {
  assertCRDTStore(store);

  if (store === EVENTS_STORE) {
    throw new Error('Events store is append-only. Cannot delete events.');
  }

  if (isBridgeWriting(notebookId)) return;

  const ymap = getStoreMap(notebookId, store);
  const doc = getDoc(notebookId);
  doc.transact(() => {
    ymap.delete(key);
  });
}

/**
 * Batch put through the CRDT layer.
 *
 * All records are written in a single Y.Doc transaction, which means
 * they are atomic from the CRDT perspective and produce a single
 * binary update for sync.
 */
export function crdtPutBatch<T extends { id: string }>(
  notebookId: string,
  store: StoreName,
  records: T[],
): void {
  assertCRDTStore(store);

  if (records.length === 0) return;
  if (isBridgeWriting(notebookId)) return;

  const doc = getDoc(notebookId);

  if (store === EVENTS_STORE) {
    const arr = getEventsArray(notebookId);
    doc.transact(() => {
      arr.push(records);
    });
    return;
  }

  const ymap = getStoreMap(notebookId, store);
  doc.transact(() => {
    for (const record of records) {
      ymap.set(record.id, record);
    }
  });
}
