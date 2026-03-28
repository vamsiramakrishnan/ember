/**
 * CRDT Document Manager — manages Y.Doc instances per notebook.
 *
 * Each notebook gets its own Y.Doc containing Y.Maps for entity stores
 * and a Y.Array for append-only events. Documents are cached in memory
 * and destroyed when the student navigates away from a notebook.
 */
import * as Y from 'yjs';
import { Store, type StoreName } from '../schema';

/** All store names that use Y.Map (keyed by record ID or hash). */
const MAP_STORES: readonly StoreName[] = [
  Store.Sessions,
  Store.Entries,
  Store.Lexicon,
  Store.Encounters,
  Store.Library,
  Store.Mastery,
  Store.Canvas,
  Store.Relations,
  Store.Curiosities,
] as const;

/** The events store uses Y.Array (append-only). */
const EVENTS_STORE = Store.Events;

/** In-memory cache of Y.Doc instances, keyed by notebook ID. */
const docs = new Map<string, Y.Doc>();

/** Get or create a Y.Doc for a notebook. */
export function getDoc(notebookId: string): Y.Doc {
  const existing = docs.get(notebookId);
  if (existing) return existing;

  const doc = new Y.Doc();
  docs.set(notebookId, doc);
  return doc;
}

/** Destroy a doc when leaving a notebook. Frees memory and disconnects providers. */
export function destroyDoc(notebookId: string): void {
  const doc = docs.get(notebookId);
  if (!doc) return;
  doc.destroy();
  docs.delete(notebookId);
}

/**
 * Get the Y.Map for a specific store within a notebook doc.
 * Throws if called with the events store (use getEventsArray instead).
 */
export function getStoreMap(notebookId: string, storeName: StoreName): Y.Map<unknown> {
  if (storeName === EVENTS_STORE) {
    throw new Error(
      `Store "${EVENTS_STORE}" is append-only. Use getEventsArray() instead.`,
    );
  }
  if (!MAP_STORES.includes(storeName)) {
    throw new Error(
      `Store "${storeName}" is not managed by the CRDT layer. ` +
      `Only notebook-scoped stores are synced.`,
    );
  }
  const doc = getDoc(notebookId);
  return doc.getMap(storeName);
}

/** Get the Y.Array for the append-only events store. */
export function getEventsArray(notebookId: string): Y.Array<unknown> {
  const doc = getDoc(notebookId);
  return doc.getArray(EVENTS_STORE);
}

/** Check whether a doc exists for the given notebook (without creating one). */
export function hasDoc(notebookId: string): boolean {
  return docs.has(notebookId);
}

/** The list of store names managed as Y.Maps. */
export { MAP_STORES, EVENTS_STORE };
