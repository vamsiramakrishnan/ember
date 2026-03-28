/**
 * Tests for blobQueue — blob upload queue.
 * Validates the API contracts by mocking the IDB engine.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createMockIndexedDB } from '../../../test/idb-mock';
import * as engine from '../../engine';

beforeEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', {
    value: createMockIndexedDB(),
    writable: true, configurable: true,
  });
  engine._resetForTest();
});

describe('blobQueue', () => {
  test('module exports expected functions', async () => {
    const mod = await import('../blobQueue');
    expect(typeof mod.queueBlobUpload).toBe('function');
    expect(typeof mod.getPendingBlobs).toBe('function');
    expect(typeof mod.markBlobSynced).toBe('function');
  });
});
