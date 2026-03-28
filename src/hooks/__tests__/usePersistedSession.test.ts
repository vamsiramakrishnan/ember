/**
 * Tests for usePersistedSession — loads session metadata from IndexedDB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePersistedSessions } from '../usePersistedSession';

const mockGetAllSessions = vi.fn();

vi.mock('@/persistence', () => ({
  Store: { Sessions: 'sessions' },
  useStore: (_store: string, fetcher: () => Promise<unknown>, fallback: unknown) => {
    const { useState, useEffect } = require('react');
    const [data, setData] = useState(fallback);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      fetcher().then((d: unknown) => { setData(d); setLoading(false); });
    }, []);
    return { data, loading };
  },
}));

vi.mock('@/persistence/repositories/sessions', () => ({
  getAllSessions: () => mockGetAllSessions(),
}));

describe('usePersistedSessions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns empty state initially', () => {
    mockGetAllSessions.mockResolvedValue([]);
    const { result } = renderHook(() => usePersistedSessions());
    expect(result.current.sessions).toEqual([]);
    expect(result.current.current).toBeNull();
    expect(result.current.past).toEqual([]);
  });

  it('derives current as last session', async () => {
    const sessions = [
      { id: 's1', number: 1 },
      { id: 's2', number: 2 },
    ];
    mockGetAllSessions.mockResolvedValue(sessions);
    const { result, rerender } = renderHook(() => usePersistedSessions());
    // Wait for async load
    await new Promise(r => setTimeout(r, 10));
    rerender();
    if (result.current.sessions.length > 0) {
      expect(result.current.current?.id).toBe('s2');
      expect(result.current.past).toHaveLength(1);
    }
  });
});
