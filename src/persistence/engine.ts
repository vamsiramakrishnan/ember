/**
 * Storage Engine — typed IndexedDB wrapper.
 * Opens the database, runs migrations, and provides transaction primitives.
 * All operations return Promises. Batch writes are atomic within a transaction.
 */
import { DB_NAME, DB_VERSION, stores, type StoreName } from './schema';
import { promisify, txDone as txComplete } from './idb-utils';
import { createOplogStores } from './sync/oplog';

let dbInstance: IDBDatabase | null = null;

/** Open (or create) the database, running migrations as needed. */
export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      for (const def of stores) {
        if (db.objectStoreNames.contains(def.name)) continue;
        const store = db.createObjectStore(def.name, { keyPath: def.keyPath });
        for (const idx of def.indexes) {
          store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
        }
      }
      createOplogStores(db);
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}


/** Get a single record by key. */
export async function get<T>(
  storeName: StoreName,
  key: string,
): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const result = await promisify<T>(tx.objectStore(storeName).get(key));
  return result ?? undefined;
}

/** Get all records from a store. */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  return promisify<T[]>(tx.objectStore(storeName).getAll());
}

/** Get all records matching an index value. */
export async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const index = tx.objectStore(storeName).index(indexName);
  return promisify<T[]>(index.getAll(value));
}

/** Put a single record (insert or update). */
export async function put<T>(storeName: StoreName, record: T): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(record);
  await txComplete(tx);
}

/** Batch put — atomic write of multiple records to the same store. */
export async function putBatch<T>(
  storeName: StoreName,
  records: T[],
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const record of records) store.put(record);
  await txComplete(tx);
}

/** Delete a record by key. */
export async function del(
  storeName: StoreName,
  key: string,
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  await txComplete(tx);
}

/** Count records in a store (optionally by index). */
export async function count(
  storeName: StoreName,
  indexName?: string,
  value?: IDBValidKey | IDBKeyRange,
): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const target = indexName
    ? tx.objectStore(storeName).index(indexName)
    : tx.objectStore(storeName);
  return promisify<number>(target.count(value));
}

/**
 * Atomic read-modify-write. Reads a record by key, applies the updater,
 * and writes back — all within a single read-write transaction.
 * Returns the updated record, or undefined if the key was not found.
 */
export async function patch<T extends { id: string }>(
  storeName: StoreName,
  id: string,
  updater: (existing: T) => T,
): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const existing = await promisify<T | undefined>(store.get(id));
  if (!existing) return undefined;
  const updated = updater(existing);
  await promisify(store.put(updated));
  await txComplete(tx);
  return updated;
}

/**
 * Atomic upsert-by-index. Looks up a record by index within a single
 * read-write transaction. If found, applies `updater`; if not, inserts
 * the result of `creator()`. Returns the final record.
 */
export async function upsertByIndex<T>(
  storeName: StoreName,
  indexName: string,
  key: IDBValidKey,
  updater: (existing: T) => T,
  creator: () => T,
): Promise<T> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  const existing = await promisify<T[]>(index.getAll(key));
  const first = existing[0];
  const record = first ? updater(first) : creator();
  await promisify(store.put(record));
  await txComplete(tx);
  return record;
}

/** Clear all records from a store. */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await txComplete(tx);
}
