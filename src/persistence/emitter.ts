/**
 * Store Emitter — reactive change notifications for persistence stores.
 * React hooks subscribe to specific stores; when data is written,
 * subscribers are notified to re-read. This is the bridge between
 * IndexedDB (imperative) and React (declarative).
 */
import type { StoreName } from './schema';

type Listener = () => void;

const listeners = new Map<StoreName, Set<Listener>>();

/** Subscribe to changes on a store. Returns an unsubscribe function. */
export function subscribe(store: StoreName, listener: Listener): () => void {
  let storeListeners = listeners.get(store);
  if (!storeListeners) {
    storeListeners = new Set();
    listeners.set(store, storeListeners);
  }
  storeListeners.add(listener);
  return () => { storeListeners?.delete(listener); };
}

/** Notify all subscribers that a store has changed. */
export function notify(store: StoreName): void {
  const storeListeners = listeners.get(store);
  if (!storeListeners) return;
  for (const listener of storeListeners) {
    listener();
  }
}

/**
 * Notify multiple stores at once (for multi-store transactions).
 * Batches into a single microtask to avoid redundant renders.
 */
export function notifyStores(stores: StoreName[]): void {
  queueMicrotask(() => {
    for (const store of stores) notify(store);
  });
}
