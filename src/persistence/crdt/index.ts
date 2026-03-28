/**
 * CRDT Layer — public API.
 *
 * Re-exports the pieces needed to integrate Yjs-based conflict-free
 * replication into the Ember persistence stack.
 *
 * - doc: Y.Doc lifecycle (create, destroy, access shared types)
 * - bridge: Y.Doc → IDB observer that keeps IndexedDB in sync
 * - sync-provider: Supabase push/pull of Y.Doc binary updates
 * - local-provider: y-indexeddb for offline persistence of Y.Doc
 * - reactive-crdt: write-through API that replaces reactivePut/Del
 */

export { getDoc, destroyDoc, getStoreMap, getEventsArray, hasDoc } from './doc';
export { bridgeDocToIDB, isBridgeWriting } from './bridge';
export { CRDTSyncProvider } from './sync-provider';
export { createLocalProvider } from './local-provider';
export { crdtPut, crdtDel, crdtPutBatch } from './reactive-crdt';
