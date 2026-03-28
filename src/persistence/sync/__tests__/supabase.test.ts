/**
 * Tests for supabase sync adapter.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createSupabaseAdapter } from '../supabase';

const mockFetch = vi.fn();
Object.defineProperty(globalThis, 'fetch', { value: mockFetch, writable: true });

describe('supabase sync adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  const adapter = createSupabaseAdapter({
    url: 'https://test.supabase.co', anonKey: 'test-key',
  });

  test('pushOperations sends POST and returns IDs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'op-1' }, { id: 'op-2' }]),
    });

    const ids = await adapter.pushOperations([
      { id: 'op-1', store: 'entries', action: 'put', key: 'e1', timestamp: 100, synced: false },
      { id: 'op-2', store: 'entries', action: 'put', key: 'e2', timestamp: 200, synced: false },
    ]);
    expect(ids).toEqual(['op-1', 'op-2']);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.supabase.co/rest/v1/sync_operations',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('pushOperations throws on failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(adapter.pushOperations([
      { id: 'op-1', store: 'entries', action: 'put', key: 'e1', timestamp: 100, synced: false },
    ])).rejects.toThrow('Push failed');
  });

  test('pullOperations sends GET and returns operations', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'op-1', store: 'entries', action: 'put', key: 'e1', payload: '{"id":"e1"}', client_timestamp: 100 },
      ]),
    });
    const ops = await adapter.pullOperations(0);
    expect(ops).toHaveLength(1);
    expect(ops[0]!.payload).toEqual({ id: 'e1' });
  });

  test('pullOperations throws on failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    await expect(adapter.pullOperations(0)).rejects.toThrow('Pull failed');
  });

  test('uploadBlob sends blob via POST', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const blob = new Blob(['hello']);
    await adapter.uploadBlob('hash1', blob, 'text/plain');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.supabase.co/storage/v1/object/ember-blobs/hash1',
      expect.objectContaining({ method: 'POST', body: blob }),
    );
  });

  test('downloadBlob returns null on failure', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const result = await adapter.downloadBlob('hash1');
    expect(result).toBeNull();
  });

  test('isOnline returns false when navigator offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    const result = await adapter.isOnline();
    expect(result).toBe(false);
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  test('isOnline returns false on fetch error', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await adapter.isOnline();
    expect(result).toBe(false);
  });
});
