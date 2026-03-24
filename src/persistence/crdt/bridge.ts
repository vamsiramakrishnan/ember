/**
 * CRDT ↔ IDB Bridge — observes Y.Doc changes and writes them to IndexedDB.
 *
 * This is the critical integration piece. When a Y.Map entry changes (locally
 * or from a remote peer), the bridge writes the value to the corresponding
 * IDB store and notifies the emitter so React re-renders.
 *
 * A suppression flag prevents echo loops: when the bridge itself writes to
 * IDB, it does NOT re-record the change into the Y.Doc.
 */
import * as Y from 'yjs';
import { put, del, putBatch } from '../engine';
import { notify } from '../emitter';
import type { StoreName } from '../schema';
import { getDoc, getEventsArray, MAP_STORES, EVENTS_STORE } from './doc';

/**
 * Per-notebook flag: true while the bridge is writing to IDB.
 * External code can check this to avoid writing back to Y.Doc.
 */
const bridgeWriting = new Map<string, boolean>();

/** Check if the bridge is currently writing to IDB for a notebook. */
export function isBridgeWriting(notebookId: string): boolean {
  return bridgeWriting.get(notebookId) === true;
}

/**
 * Start observing a Y.Doc and writing changes to IDB.
 * Returns a cleanup function that removes all observers.
 */
export function bridgeDocToIDB(notebookId: string): () => void {
  const doc = getDoc(notebookId);
  const cleanups: Array<() => void> = [];

  // Observe each Y.Map store.
  for (const storeName of MAP_STORES) {
    const ymap = doc.getMap(storeName);
    const handler = (events: Y.YMapEvent<unknown>): void => {
      handleMapChanges(notebookId, storeName, events);
    };
    ymap.observe(handler);
    cleanups.push(() => ymap.unobserve(handler));
  }

  // Observe the append-only events array.
  const eventsArray = getEventsArray(notebookId);
  const eventsHandler = (events: Y.YArrayEvent<unknown>): void => {
    handleArrayAppend(notebookId, events);
  };
  eventsArray.observe(eventsHandler);
  cleanups.push(() => eventsArray.unobserve(eventsHandler));

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}

/**
 * Handle Y.Map changes: writes adds/updates to IDB, deletes removed keys.
 * Batches multiple changes from a single transaction into one IDB write.
 */
function handleMapChanges(
  notebookId: string,
  storeName: StoreName,
  event: Y.YMapEvent<unknown>,
): void {
  const puts: Array<Record<string, unknown>> = [];
  const deletes: string[] = [];

  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add' || change.action === 'update') {
      const value = event.target.get(key);
      if (value != null && typeof value === 'object') {
        puts.push(value as Record<string, unknown>);
      }
    } else if (change.action === 'delete') {
      deletes.push(key);
    }
  });

  if (puts.length === 0 && deletes.length === 0) return;

  // Mark as bridge-writing to prevent echo loops.
  bridgeWriting.set(notebookId, true);

  const work = async (): Promise<void> => {
    try {
      if (puts.length === 1) {
        await put(storeName, puts[0]);
      } else if (puts.length > 1) {
        await putBatch(storeName, puts);
      }

      for (const key of deletes) {
        await del(storeName, key);
      }

      notify(storeName);
    } finally {
      bridgeWriting.set(notebookId, false);
    }
  };

  // Fire and forget — IDB writes are fast and the bridge must not block Yjs.
  void work();
}

/**
 * Handle Y.Array appends for the events store.
 * Only processes insertions (events are append-only, never updated or deleted).
 */
function handleArrayAppend(
  notebookId: string,
  event: Y.YArrayEvent<unknown>,
): void {
  const inserts: Array<Record<string, unknown>> = [];

  for (const item of event.changes.added) {
    const arr = item.content.getContent();
    for (const val of arr) {
      if (val != null && typeof val === 'object') {
        inserts.push(val as Record<string, unknown>);
      }
    }
  }

  if (inserts.length === 0) return;

  bridgeWriting.set(notebookId, true);

  const work = async (): Promise<void> => {
    try {
      if (inserts.length === 1) {
        await put(EVENTS_STORE, inserts[0]);
      } else {
        await putBatch(EVENTS_STORE, inserts);
      }
      notify(EVENTS_STORE);
    } finally {
      bridgeWriting.set(notebookId, false);
    }
  };

  void work();
}
