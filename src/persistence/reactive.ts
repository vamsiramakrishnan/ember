/**
 * Reactive write operations — wraps engine writes with change notifications.
 * Use these instead of raw engine functions when writes should trigger
 * React re-renders via useStore subscriptions.
 */
import * as engine from './engine';
import { transact as rawTransact, type TxOperation } from './transaction';
import { notify, notifyStores } from './emitter';
import type { StoreName } from './schema';

/** Put a record and notify subscribers. */
export async function reactivePut<T>(
  store: StoreName,
  record: T,
): Promise<void> {
  await engine.put(store, record);
  notify(store);
}

/** Batch put and notify subscribers. */
export async function reactivePutBatch<T>(
  store: StoreName,
  records: T[],
): Promise<void> {
  await engine.putBatch(store, records);
  notify(store);
}

/** Delete and notify subscribers. */
export async function reactiveDel(
  store: StoreName,
  key: string,
): Promise<void> {
  await engine.del(store, key);
  notify(store);
}

/** Clear a store and notify subscribers. */
export async function reactiveClear(store: StoreName): Promise<void> {
  await engine.clear(store);
  notify(store);
}

/** Multi-store transaction with notifications on all affected stores. */
export async function reactiveTransact(
  operations: TxOperation[],
): Promise<void> {
  await rawTransact(operations);
  const affected = [...new Set(operations.map((op) => op.store))];
  notifyStores(affected);
}
