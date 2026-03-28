/**
 * Tests for usePersistedNotebook — IndexedDB-backed notebook state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedNotebook } from '../usePersistedNotebook';

const mockCreateEntry = vi.fn();
const mockGetEntriesBySession = vi.fn();
const mockUpdateEntry = vi.fn();
const mockUpdateEntryContent = vi.fn();
const mockNotify = vi.fn();

vi.mock('@/persistence', () => ({
  Store: { Entries: 'entries' },
  notify: (...args: unknown[]) => mockNotify(...args),
  useStoreQuery: <T>(_store: string, fetcher: () => Promise<T>, fallback: T, _deps: unknown[]) => {
    const { useState, useEffect } = require('react');
    const [data, setData] = useState<T>(fallback);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      fetcher().then((d: T) => { setData(d); setLoading(false); });
    }, []);
    return { data, loading };
  },
}));

vi.mock('@/persistence/repositories/entries', () => ({
  createEntry: (...args: unknown[]) => mockCreateEntry(...args),
  getEntriesBySession: (...args: unknown[]) => mockGetEntriesBySession(...args),
  updateEntry: (...args: unknown[]) => mockUpdateEntry(...args),
  updateEntryContent: (...args: unknown[]) => mockUpdateEntryContent(...args),
}));

vi.mock('@/persistence/ids', () => ({
  createId: () => `id-${Date.now()}-${Math.random()}`,
}));

vi.mock('./persisted-notebook-helpers', () => ({
  recordToLiveEntry: vi.fn().mockImplementation((rec: Record<string, unknown>) =>
    Promise.resolve({
      id: rec.id, entry: rec.entry,
      crossedOut: false, bookmarked: false, pinned: false,
      timestamp: Date.now(), annotations: [],
    }),
  ),
  reconcileContentPatches: (prev: Map<string, unknown>) => prev,
  reconcileMetaPatches: (prev: Map<string, unknown>) => prev,
}));

describe('usePersistedNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEntriesBySession.mockResolvedValue([]);
    mockCreateEntry.mockResolvedValue({ id: 'new-entry' });
    mockUpdateEntry.mockResolvedValue(undefined);
    mockUpdateEntryContent.mockResolvedValue(undefined);
  });

  it('returns empty entries when sessionId is null', () => {
    const { result } = renderHook(() => usePersistedNotebook(null));
    expect(result.current.entries).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('provides addEntry function', async () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    await act(async () => {
      await result.current.addEntry({ type: 'prose', content: 'Hello' });
    });
    expect(mockCreateEntry).toHaveBeenCalledWith('sess1', { type: 'prose', content: 'Hello' });
    expect(mockNotify).toHaveBeenCalled();
  });

  it('addEntry does nothing without sessionId', async () => {
    const { result } = renderHook(() => usePersistedNotebook(null));
    await act(async () => {
      await result.current.addEntry({ type: 'prose', content: 'Hello' });
    });
    expect(mockCreateEntry).not.toHaveBeenCalled();
  });

  it('addEntryWithId returns empty string without sessionId', async () => {
    const { result } = renderHook(() => usePersistedNotebook(null));
    let id = '';
    await act(async () => {
      id = await result.current.addEntryWithId({ type: 'prose', content: 'Hello' });
    });
    expect(id).toBe('');
  });

  it('provides crossOut toggle', () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    expect(typeof result.current.crossOut).toBe('function');
  });

  it('provides toggleBookmark', () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    expect(typeof result.current.toggleBookmark).toBe('function');
  });

  it('provides togglePin', () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    expect(typeof result.current.togglePin).toBe('function');
  });

  it('provides annotate function', () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    expect(typeof result.current.annotate).toBe('function');
  });

  it('pinnedEntries is initially empty', () => {
    const { result } = renderHook(() => usePersistedNotebook('sess1'));
    expect(result.current.pinnedEntries).toEqual([]);
  });
});
