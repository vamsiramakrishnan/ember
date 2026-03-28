/**
 * Tests for useEntryReorder — drag-to-reorder notebook entries.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntryReorder } from '../useEntryReorder';

const mockGetEntry = vi.fn();
const mockUpdateEntry = vi.fn();
const mockNotify = vi.fn();

vi.mock('@/persistence/repositories/entries', () => ({
  getEntry: (...args: unknown[]) => mockGetEntry(...args),
  updateEntry: (...args: unknown[]) => mockUpdateEntry(...args),
}));

vi.mock('@/persistence', () => ({
  Store: { Entries: 'entries' },
  notify: (...args: unknown[]) => mockNotify(...args),
}));

describe('useEntryReorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEntry.mockResolvedValue(null);
    mockUpdateEntry.mockResolvedValue(undefined);
  });

  it('starts with no drag state', () => {
    const { result } = renderHook(() => useEntryReorder());
    expect(result.current.dragId).toBeNull();
    expect(result.current.overId).toBeNull();
  });

  it('sets drag state on dragStart', () => {
    const { result } = renderHook(() => useEntryReorder());
    const mockEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
      clientY: 100,
    } as unknown as React.DragEvent;

    act(() => { result.current.onDragStart('e1', mockEvent); });
    expect(result.current.dragId).toBe('e1');
  });

  it('sets overId on dragOver', () => {
    const { result } = renderHook(() => useEntryReorder());
    const startEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
      clientY: 100,
    } as unknown as React.DragEvent;

    act(() => { result.current.onDragStart('e1', startEvent); });

    const overEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as React.DragEvent;

    act(() => { result.current.onDragOver('e2', overEvent); });
    expect(result.current.overId).toBe('e2');
  });

  it('clears state on dragEnd', () => {
    const { result } = renderHook(() => useEntryReorder());
    const startEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
      clientY: 100,
    } as unknown as React.DragEvent;

    act(() => { result.current.onDragStart('e1', startEvent); });
    act(() => { result.current.onDragEnd(); });
    expect(result.current.dragId).toBeNull();
    expect(result.current.overId).toBeNull();
  });

  it('swaps entries on drop', async () => {
    mockGetEntry.mockImplementation((id: string) =>
      Promise.resolve({ id, order: id === 'e1' ? 0 : 1 }),
    );

    const { result } = renderHook(() => useEntryReorder());
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { getData: () => 'e1' },
    } as unknown as React.DragEvent;

    await act(async () => { await result.current.onDrop('e2', dropEvent); });
    expect(mockUpdateEntry).toHaveBeenCalledTimes(2);
    expect(mockNotify).toHaveBeenCalled();
  });

  it('does not swap when source equals target', async () => {
    const { result } = renderHook(() => useEntryReorder());
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { getData: () => 'e1' },
    } as unknown as React.DragEvent;

    await act(async () => { await result.current.onDrop('e1', dropEvent); });
    expect(mockGetEntry).not.toHaveBeenCalled();
  });

  it('clears overId on dragLeave', () => {
    const { result } = renderHook(() => useEntryReorder());
    const startEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
      clientY: 100,
    } as unknown as React.DragEvent;

    act(() => { result.current.onDragStart('e1', startEvent); });
    act(() => {
      const overEvent = {
        preventDefault: vi.fn(), stopPropagation: vi.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent;
      result.current.onDragOver('e2', overEvent);
    });
    act(() => { result.current.onDragLeave('e2'); });
    expect(result.current.overId).toBeNull();
  });
});
