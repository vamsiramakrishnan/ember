/**
 * Tests for idb-utils — Promise wrappers for IndexedDB.
 */
import { describe, test, expect, vi } from 'vitest';
import { promisify, txDone } from '../idb-utils';

describe('idb-utils', () => {
  describe('promisify', () => {
    test('resolves with result on success', async () => {
      const mockRequest = {
        result: 'test-value',
        error: null,
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
      };
      const promise = promisify(mockRequest as unknown as IDBRequest<string>);
      // Trigger success
      queueMicrotask(() => {
        if (mockRequest.onsuccess) mockRequest.onsuccess(new Event('success'));
      });
      const result = await promise;
      expect(result).toBe('test-value');
    });

    test('rejects on error', async () => {
      const mockRequest = {
        result: null,
        error: new DOMException('test error'),
        onsuccess: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
      };
      const promise = promisify(mockRequest as unknown as IDBRequest<string>);
      queueMicrotask(() => {
        if (mockRequest.onerror) mockRequest.onerror(new Event('error'));
      });
      await expect(promise).rejects.toBeDefined();
    });
  });

  describe('txDone', () => {
    test('resolves on complete', async () => {
      const mockTx = {
        oncomplete: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onabort: null as ((ev: Event) => void) | null,
        error: null,
      };
      const promise = txDone(mockTx as unknown as IDBTransaction);
      queueMicrotask(() => {
        if (mockTx.oncomplete) mockTx.oncomplete(new Event('complete'));
      });
      await expect(promise).resolves.toBeUndefined();
    });

    test('rejects on error', async () => {
      const mockTx = {
        oncomplete: null as ((ev: Event) => void) | null,
        onerror: null as ((ev: Event) => void) | null,
        onabort: null as ((ev: Event) => void) | null,
        error: new DOMException('tx error'),
      };
      const promise = txDone(mockTx as unknown as IDBTransaction);
      queueMicrotask(() => {
        if (mockTx.onerror) mockTx.onerror(new Event('error'));
      });
      await expect(promise).rejects.toBeDefined();
    });
  });
});
