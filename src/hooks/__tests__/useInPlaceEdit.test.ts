/**
 * Tests for useInPlaceEdit — in-place editing of notebook entries.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInPlaceEdit } from '../useInPlaceEdit';

vi.mock('@/persistence/repositories/entries', () => ({
  updateEntryContent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/persistence', () => ({
  notify: vi.fn(),
  Store: { Entries: 'entries' },
}));

describe('useInPlaceEdit', () => {
  it('starts with no entry being edited', () => {
    const { result } = renderHook(() => useInPlaceEdit());
    expect(result.current.editingId).toBeNull();
  });

  it('starts editing a student entry', () => {
    const { result } = renderHook(() => useInPlaceEdit());
    act(() => { result.current.startEdit('e1', 'prose'); });
    expect(result.current.editingId).toBe('e1');
    expect(result.current.isEditing('e1')).toBe(true);
    expect(result.current.isEditing('e2')).toBe(false);
  });

  it('refuses to edit non-student types', () => {
    const { result } = renderHook(() => useInPlaceEdit());
    act(() => { result.current.startEdit('e1', 'tutor-marginalia'); });
    expect(result.current.editingId).toBeNull();
  });

  it('cancels editing', () => {
    const { result } = renderHook(() => useInPlaceEdit());
    act(() => { result.current.startEdit('e1', 'prose'); });
    act(() => { result.current.cancelEdit(); });
    expect(result.current.editingId).toBeNull();
  });

  it('saves editing and clears state', async () => {
    const { result } = renderHook(() => useInPlaceEdit());
    act(() => { result.current.startEdit('e1', 'prose'); });
    await act(async () => {
      await result.current.saveEdit('e1', 'Updated content', 'prose');
    });
    expect(result.current.editingId).toBeNull();
  });

  it('does not save empty content', async () => {
    const { result } = renderHook(() => useInPlaceEdit());
    act(() => { result.current.startEdit('e1', 'prose'); });
    await act(async () => {
      await result.current.saveEdit('e1', '  ', 'prose');
    });
    expect(result.current.editingId).toBeNull();
  });

  it('reports editable types correctly', () => {
    const { result } = renderHook(() => useInPlaceEdit());
    expect(result.current.isEditable('prose')).toBe(true);
    expect(result.current.isEditable('scratch')).toBe(true);
    expect(result.current.isEditable('hypothesis')).toBe(true);
    expect(result.current.isEditable('question')).toBe(true);
    expect(result.current.isEditable('tutor-marginalia')).toBe(false);
    expect(result.current.isEditable('silence')).toBe(false);
  });
});
