/**
 * Tests for blobs repository — content-addressed binary storage.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
}));

import { dataUrlToBlob, storeBlob, getBlob, deleteBlob, getBlobsByRef } from '../blobs';
import { get, put, del, getByIndex } from '../../engine';

// Mock crypto.subtle for sha256
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: { digest: mockDigest },
    getRandomValues: (arr: Uint8Array) => { for (let i = 0; i < arr.length; i++) arr[i] = i; return arr; },
  },
  writable: true,
  configurable: true,
});

describe('blobs repository', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('dataUrlToBlob', () => {
    test('converts base64 data URL to Blob', () => {
      const dataUrl = 'data:image/png;base64,aGVsbG8=';
      const blob = dataUrlToBlob(dataUrl);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    test('handles missing mime type gracefully', () => {
      const dataUrl = 'data:;base64,aGVsbG8=';
      const blob = dataUrlToBlob(dataUrl);
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('storeBlob', () => {
    test('stores new blob and returns hash', async () => {
      vi.mocked(get).mockResolvedValue(undefined);
      const blob = new Blob(['hello'], { type: 'text/plain' });
      const hash = await storeBlob(blob);
      expect(typeof hash).toBe('string');
      expect(put).toHaveBeenCalledOnce();
    });

    test('returns existing hash for duplicate content', async () => {
      vi.mocked(get).mockResolvedValue({ hash: 'existing' });
      const blob = new Blob(['hello'], { type: 'text/plain' });
      const hash = await storeBlob(blob);
      expect(typeof hash).toBe('string');
      expect(put).not.toHaveBeenCalled();
    });
  });

  describe('getBlob', () => {
    test('delegates to engine.get', async () => {
      vi.mocked(get).mockResolvedValue({ hash: 'abc', data: new Blob() });
      const result = await getBlob('abc');
      expect(result).toBeDefined();
    });
  });

  describe('deleteBlob', () => {
    test('delegates to engine.del', async () => {
      await deleteBlob('abc');
      expect(del).toHaveBeenCalledWith('blobs', 'abc');
    });
  });

  describe('getBlobsByRef', () => {
    test('delegates to getByIndex', async () => {
      await getBlobsByRef('entry-1');
      expect(getByIndex).toHaveBeenCalledWith('blobs', 'by-ref', 'entry-1');
    });
  });
});
