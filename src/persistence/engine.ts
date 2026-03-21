/**
 * Storage Engine — typed IndexedDB wrapper.
 * Opens the database, runs migrations, and provides transaction primitives.
 * All operations return Promises. Batch writes are atomic within a transaction.
 */
import { DB_NAME, DB_VERSION, stores, type StoreName } from './schema';

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
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

/** Wrap an IDBRequest in a Promise. */
function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Wrap a transaction completion in a Promise. */
function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
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

/** Clear all records from a store. */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await txComplete(tx);
}
