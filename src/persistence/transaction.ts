/**
 * Multi-store transactions — atomic operations across multiple stores.
 * Used when an action must update entries AND blobs, or sessions AND entries.
 */
import { openDB } from './engine';
import type { StoreName } from './schema';

export interface TxOperation {
  store: StoreName;
  action: 'put' | 'delete' | 'clear';
  /** Record to put, or key to delete. Ignored for 'clear'. */
  data?: unknown;
}

/**
 * Execute a batch of operations across multiple stores in a single transaction.
 * All operations succeed or all fail — true ACID within IndexedDB's guarantees.
 */
export async function transact(operations: TxOperation[]): Promise<void> {
  const db = await openDB();
  const storeNames = [...new Set(operations.map((op) => op.store))];
  const tx = db.transaction(storeNames, 'readwrite');

  for (const op of operations) {
    const store = tx.objectStore(op.store);
    switch (op.action) {
      case 'put':
        store.put(op.data);
        break;
      case 'delete':
        store.delete(op.data as string);
        break;
      case 'clear':
        store.clear();
        break;
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Run a callback with direct access to object stores within a transaction.
 * For complex operations that need to read-then-write atomically.
 */
export async function withTransaction(
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  callback: (stores: Record<string, IDBObjectStore>) => void,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeNames, mode);
  const storeMap: Record<string, IDBObjectStore> = {};
  for (const name of storeNames) {
    storeMap[name] = tx.objectStore(name);
  }
  callback(storeMap);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
