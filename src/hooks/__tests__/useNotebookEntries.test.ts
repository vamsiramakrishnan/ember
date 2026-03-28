/**
 * Tests for useNotebookEntries — deprecated in-memory entry manager.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotebookEntries } from '../useNotebookEntries';
import type { NotebookEntry } from '@/types/entries';

describe('useNotebookEntries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const initial: NotebookEntry[] = [
    { type: 'prose', content: 'First entry' },
    { type: 'question', content: 'What is this?' },
  ];

  it('initializes with provided entries', () => {
    const { result } = renderHook(() => useNotebookEntries(initial));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0]!.entry).toMatchObject({ type: 'prose', content: 'First entry' });
  });

  it('assigns unique IDs to entries', () => {
    const { result } = renderHook(() => useNotebookEntries(initial));
    const ids = result.current.entries.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('adds an entry', () => {
    const { result } = renderHook(() => useNotebookEntries([]));
    act(() => {
      result.current.addEntry({ type: 'prose', content: 'New' });
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it('adds multiple entries at once', () => {
    const { result } = renderHook(() => useNotebookEntries([]));
    act(() => {
      result.current.addEntries([
        { type: 'prose', content: 'A' },
        { type: 'prose', content: 'B' },
      ]);
    });
    expect(result.current.entries).toHaveLength(2);
  });

  it('addEntryWithId returns an id', () => {
    const { result } = renderHook(() => useNotebookEntries([]));
    let id: string = '';
    act(() => {
      id = result.current.addEntryWithId({ type: 'prose', content: 'With ID' });
    });
    expect(id).toBeTruthy();
    expect(result.current.entries).toHaveLength(1);
  });

  it('updates an existing entry', () => {
    const { result } = renderHook(() => useNotebookEntries(initial));
    const id = result.current.entries[0]!.id;
    act(() => {
      result.current.updateEntry(id, { type: 'prose', content: 'Updated' });
    });
    expect(result.current.entries[0]!.entry).toMatchObject({ content: 'Updated' });
  });

  it('toggles crossOut', () => {
    const { result } = renderHook(() => useNotebookEntries(initial));
    const id = result.current.entries[0]!.id;
    expect(result.current.entries[0]!.crossedOut).toBe(false);
    act(() => { result.current.crossOut(id); });
    expect(result.current.entries[0]!.crossedOut).toBe(true);
    act(() => { result.current.crossOut(id); });
    expect(result.current.entries[0]!.crossedOut).toBe(false);
  });

  it('toggles bookmark', () => {
    const { result } = renderHook(() => useNotebookEntries(initial));
    const id = result.current.entries[0]!.id;
    act(() => { result.current.toggleBookmark(id); });
    expect(result.current.entries[0]!.bookmarked).toBe(true);
  });

  it('limits pinned entries to 3', () => {
    const entries: NotebookEntry[] = [
      { type: 'question', content: 'Q1' },
      { type: 'question', content: 'Q2' },
      { type: 'question', content: 'Q3' },
      { type: 'question', content: 'Q4' },
    ];
    const { result } = renderHook(() => useNotebookEntries(entries));

    act(() => {
      result.current.togglePin(result.current.entries[0]!.id);
      result.current.togglePin(result.current.entries[1]!.id);
      result.current.togglePin(result.current.entries[2]!.id);
    });
    expect(result.current.entries.filter(e => e.pinned)).toHaveLength(3);

    // 4th pin should be rejected
    act(() => {
      result.current.togglePin(result.current.entries[3]!.id);
    });
    expect(result.current.entries[3]!.pinned).toBe(false);
  });

  it('can unpin a pinned entry', () => {
    const { result } = renderHook(() => useNotebookEntries([{ type: 'question', content: 'Q' }]));
    const id = result.current.entries[0]!.id;
    act(() => { result.current.togglePin(id); });
    expect(result.current.entries[0]!.pinned).toBe(true);
    act(() => { result.current.togglePin(id); });
    expect(result.current.entries[0]!.pinned).toBe(false);
  });

  it('pinnedEntries only includes pinned questions', () => {
    const entries: NotebookEntry[] = [
      { type: 'question', content: 'Q1' },
      { type: 'prose', content: 'P1' },
    ];
    const { result } = renderHook(() => useNotebookEntries(entries));
    act(() => {
      result.current.togglePin(result.current.entries[0]!.id);
      result.current.togglePin(result.current.entries[1]!.id);
    });
    // Only the question appears in pinnedEntries
    expect(result.current.pinnedEntries).toHaveLength(1);
    expect(result.current.pinnedEntries[0]!.entry.type).toBe('question');
  });
});
