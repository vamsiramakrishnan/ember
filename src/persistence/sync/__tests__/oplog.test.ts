/**
 * Tests for oplog — operation log for sync.
 * Uses the mock IndexedDB from test setup.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createMockIndexedDB } from '../../../test/idb-mock';
import * as engine from '../../engine';

// Reset IDB and engine before each test
beforeEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: createMockIndexedDB(),
    writable: true, configurable: true,
  });
  engine._resetForTest();
});

import { createOplogStores } from '../oplog';

describe('oplog', () => {
  test('createOplogStores creates oplog and blob_queue stores', () => {
    const mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn(),
      }),
    };
    createOplogStores(mockDb as unknown as IDBDatabase);
    expect(mockDb.createObjectStore).toHaveBeenCalledWith('oplog', { keyPath: 'id' });
    expect(mockDb.createObjectStore).toHaveBeenCalledWith('blob_queue', { keyPath: 'hash' });
  });

  test('createOplogStores skips existing stores', () => {
    const mockDb = {
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true),
      },
      createObjectStore: vi.fn(),
    };
    createOplogStores(mockDb as unknown as IDBDatabase);
    expect(mockDb.createObjectStore).not.toHaveBeenCalled();
  });
});
