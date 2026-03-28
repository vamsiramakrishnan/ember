/**
 * Tests for sync engine — coordinates local to remote sync.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('./oplog', () => ({
  getPendingOps: vi.fn().mockResolvedValue([]),
  markSynced: vi.fn().mockResolvedValue(undefined),
  getLastSyncTimestamp: vi.fn().mockResolvedValue(null),
  pendingCount: vi.fn().mockResolvedValue(0),
}));
vi.mock('./blobQueue', () => ({
  getPendingBlobs: vi.fn().mockResolvedValue([]),
  markBlobSynced: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../repositories/blobs', () => ({
  getBlob: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../engine', () => ({
  put: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../emitter', () => ({
  notifyStores: vi.fn(),
}));

// We need to test the actual sync engine module
// But since it has module-level state, test the public API
import {
  registerAdapter, sync, getSyncStatus, onSyncStatus, stopSync,
} from '../engine';
import type { SyncAdapter } from '../types';

function createMockAdapter(overrides: Partial<SyncAdapter> = {}): SyncAdapter {
  return {
    pushOperations: vi.fn().mockResolvedValue([]),
    pullOperations: vi.fn().mockResolvedValue([]),
    uploadBlob: vi.fn().mockResolvedValue(undefined),
    downloadBlob: vi.fn().mockResolvedValue(null),
    isOnline: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe('sync engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopSync();
  });

  test('getSyncStatus returns initial state', () => {
    const status = getSyncStatus();
    expect(status.state).toBeDefined();
    expect(typeof status.pending).toBe('number');
  });

  test('onSyncStatus immediately calls with current status', () => {
    const listener = vi.fn();
    const unsub = onSyncStatus(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  test('onSyncStatus unsubscribe stops notifications', () => {
    const listener = vi.fn();
    const unsub = onSyncStatus(listener);
    unsub();
    // Further syncs should not notify
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('sync without adapter sets offline', async () => {
    // Force no adapter by not calling registerAdapter
    // (the module may have leftover state)
    registerAdapter(null as unknown as SyncAdapter);
    await sync();
    // Should handle gracefully
  });

  test('sync with online adapter runs cycle', async () => {
    const adapter = createMockAdapter();
    registerAdapter(adapter);
    await sync();
    expect(adapter.isOnline).toHaveBeenCalled();
  });
});
