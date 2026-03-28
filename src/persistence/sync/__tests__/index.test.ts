/**
 * Tests for sync/index.ts — verifies all re-exports are available.
 */
import { describe, test, expect, vi } from 'vitest';

vi.mock('../engine', () => ({
  registerAdapter: vi.fn(),
  startSync: vi.fn(),
  stopSync: vi.fn(),
  sync: vi.fn(),
  getSyncStatus: vi.fn().mockReturnValue({ state: 'idle', pending: 0, lastSyncAt: null }),
  onSyncStatus: vi.fn().mockReturnValue(() => {}),
}));
vi.mock('../oplog', () => ({
  pendingCount: vi.fn().mockResolvedValue(0),
  getLastSyncTimestamp: vi.fn().mockResolvedValue(null),
  createOplogStores: vi.fn(),
  recordOp: vi.fn(),
  getPendingOps: vi.fn(),
  markSynced: vi.fn(),
}));
vi.mock('../blobQueue', () => ({
  queueBlobUpload: vi.fn(),
  getPendingBlobs: vi.fn().mockResolvedValue([]),
  markBlobSynced: vi.fn(),
}));
vi.mock('../supabase', () => ({
  createSupabaseAdapter: vi.fn(),
  createAdapterFromEnv: vi.fn().mockReturnValue(null),
}));
vi.mock('../useSyncStatus', () => ({
  useSyncStatus: vi.fn(),
}));

import * as SyncIndex from '../index';

describe('sync/index re-exports', () => {
  test('exports engine functions', () => {
    expect(typeof SyncIndex.registerAdapter).toBe('function');
    expect(typeof SyncIndex.startSync).toBe('function');
    expect(typeof SyncIndex.stopSync).toBe('function');
    expect(typeof SyncIndex.sync).toBe('function');
    expect(typeof SyncIndex.getSyncStatus).toBe('function');
  });

  test('exports oplog functions', () => {
    expect(typeof SyncIndex.pendingCount).toBe('function');
    expect(typeof SyncIndex.getLastSyncTimestamp).toBe('function');
  });

  test('exports blob queue functions', () => {
    expect(typeof SyncIndex.queueBlobUpload).toBe('function');
    expect(typeof SyncIndex.getPendingBlobs).toBe('function');
    expect(typeof SyncIndex.markBlobSynced).toBe('function');
  });

  test('exports supabase adapter', () => {
    expect(typeof SyncIndex.createSupabaseAdapter).toBe('function');
    expect(typeof SyncIndex.createAdapterFromEnv).toBe('function');
  });

  test('exports hook', () => {
    expect(typeof SyncIndex.useSyncStatus).toBe('function');
  });
});
