/**
 * CRDT Local Persistence — wraps y-indexeddb for offline-first Y.Doc storage.
 *
 * Each notebook's Y.Doc is persisted in its own IndexedDB database,
 * separate from the main Ember database. This ensures the CRDT state
 * survives page reloads and can bootstrap the Y.Doc on next visit.
 *
 * DB naming: `ember-crdt-{notebookId}`
 */
import { IndexeddbPersistence } from 'y-indexeddb';
import type * as Y from 'yjs';

/**
 * Create a y-indexeddb persistence provider for a notebook's Y.Doc.
 *
 * The provider automatically loads persisted state into the doc on creation
 * and writes incremental updates as they occur. Call `.destroy()` on the
 * returned provider when the notebook is closed.
 */
export function createLocalProvider(
  notebookId: string,
  doc: Y.Doc,
): IndexeddbPersistence {
  const dbName = `ember-crdt-${notebookId}`;
  return new IndexeddbPersistence(dbName, doc);
}
