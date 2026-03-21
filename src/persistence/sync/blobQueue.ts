/**
 * Blob Queue — tracks blobs pending upload to remote storage.
 * Stored in its own IndexedDB store alongside the oplog.
 * Synced status stored as 0/1 (IndexedDB indexes need numeric keys).
 */
import { openDB } from '../engine';

const BLOB_QUEUE_STORE = 'blob_queue';

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Queue a blob for upload. */
export async function queueBlobUpload(
  hash: string, mimeType: string, size: number,
): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(BLOB_QUEUE_STORE)) return;
  const tx = db.transaction(BLOB_QUEUE_STORE, 'readwrite');
  tx.objectStore(BLOB_QUEUE_STORE).put({ hash, mimeType, size, synced: 0 });
  await txDone(tx);
}

/** Get pending blob uploads. */
export async function getPendingBlobs(): Promise<
  { hash: string; mimeType: string; size: number }[]
> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(BLOB_QUEUE_STORE)) return [];
  const tx = db.transaction(BLOB_QUEUE_STORE, 'readonly');
  const index = tx.objectStore(BLOB_QUEUE_STORE).index('by-synced');
  return promisify(index.getAll(0));
}

/** Mark a blob as uploaded. */
export async function markBlobSynced(hash: string): Promise<void> {
  const db = await openDB();
  if (!db.objectStoreNames.contains(BLOB_QUEUE_STORE)) return;
  const tx = db.transaction(BLOB_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(BLOB_QUEUE_STORE);
  const req = store.get(hash);
  req.onsuccess = () => {
    const rec = req.result as Record<string, unknown> | undefined;
    if (rec) store.put({ ...rec, synced: 1 });
  };
  await txDone(tx);
}
