/**
 * Tests for sync types — verifies type shapes exist.
 */
import { describe, test, expect } from 'vitest';
import type { SyncOperation, SyncStatus, SyncState, BlobUpload } from '../types';

describe('sync types', () => {
  test('SyncOperation shape', () => {
    const op: SyncOperation = {
      id: 'op-1', store: 'entries', action: 'put',
      key: 'e-1', payload: {}, timestamp: 1000, synced: false,
    };
    expect(op.id).toBe('op-1');
    expect(op.synced).toBe(false);
  });

  test('SyncStatus shape', () => {
    const status: SyncStatus = {
      state: 'idle' as SyncState, pending: 0, lastSyncAt: null,
    };
    expect(status.state).toBe('idle');
  });

  test('BlobUpload shape', () => {
    const upload: BlobUpload = {
      hash: 'abc', mimeType: 'image/png', size: 1024, synced: false,
    };
    expect(upload.hash).toBe('abc');
  });
});
