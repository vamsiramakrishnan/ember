/**
 * Reactive write operations — wraps engine writes with:
 * 1. Change notifications (for React re-renders)
 * 2. Oplog recording (for background sync)
 *
 * Every mutation that flows through here is both instant (IndexedDB)
 * and eventually consistent (remote mirror via sync engine).
 */
import * as engine from './engine';
import { transact as rawTransact, type TxOperation } from './transaction';
import { notify, notifyStores } from './emitter';
import { recordOp } from './sync/oplog';
import { queueBlobUpload } from './sync/blobQueue';
import type { StoreName } from './schema';

/** Extracts the key from a record. Blobs use 'hash', everything else 'id'. */
function extractKey(record: unknown, store: StoreName): string {
  const rec = record as Record<string, unknown>;
  if (store === 'blobs') return String(rec.hash ?? '');
  return String(rec.id ?? '');
}

/** Put a record: write locally, notify React, record in oplog. */
export async function reactivePut<T>(
  store: StoreName,
  record: T,
): Promise<void> {
  await engine.put(store, record);
  notify(store);
  const key = extractKey(record, store);
  await recordOp(store, 'put', key, record);

  if (store === 'blobs') {
    const blob = record as Record<string, unknown>;
    await queueBlobUpload(
      String(blob.hash),
      String(blob.mimeType ?? 'application/octet-stream'),
      Number(blob.size ?? 0),
    );
  }
}

/** Batch put: write locally, notify, record each in oplog. */
export async function reactivePutBatch<T>(
  store: StoreName,
  records: T[],
): Promise<void> {
  await engine.putBatch(store, records);
  notify(store);
  for (const record of records) {
    const key = extractKey(record, store);
    await recordOp(store, 'put', key, record);
  }
}

/** Delete: write locally, notify, record in oplog. */
export async function reactiveDel(
  store: StoreName,
  key: string,
): Promise<void> {
  await engine.del(store, key);
  notify(store);
  await recordOp(store, 'delete', key);
}

/** Clear a store and notify subscribers. */
export async function reactiveClear(store: StoreName): Promise<void> {
  await engine.clear(store);
  notify(store);
}

/** Multi-store transaction with notifications and oplog recording. */
export async function reactiveTransact(
  operations: TxOperation[],
): Promise<void> {
  await rawTransact(operations);
  const affected = [...new Set(operations.map((op) => op.store))];
  notifyStores(affected);

  for (const op of operations) {
    if (op.action === 'put' && op.data) {
      const key = extractKey(op.data, op.store);
      await recordOp(op.store, 'put', key, op.data);
    } else if (op.action === 'delete' && op.data) {
      await recordOp(op.store, 'delete', String(op.data));
    }
  }
}
