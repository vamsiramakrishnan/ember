/**
 * Tests for useSyncStatus hook.
 */
import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../engine', () => ({
  onSyncStatus: vi.fn().mockImplementation((fn) => {
    fn({ state: 'idle', pending: 0, lastSyncAt: null });
    return () => {};
  }),
  getSyncStatus: vi.fn().mockReturnValue({ state: 'idle', pending: 0, lastSyncAt: null }),
}));

import { useSyncStatus } from '../useSyncStatus';

describe('useSyncStatus', () => {
  test('returns current sync status', () => {
    const { result } = renderHook(() => useSyncStatus());
    expect(result.current.state).toBe('idle');
    expect(result.current.pending).toBe(0);
    expect(result.current.lastSyncAt).toBeNull();
  });
});
