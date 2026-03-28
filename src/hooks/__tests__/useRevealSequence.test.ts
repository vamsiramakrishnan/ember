/**
 * Tests for useRevealSequence — staggered entry reveal animation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevealSequence } from '../useRevealSequence';

describe('useRevealSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => { vi.useRealTimers(); });

  it('starts with 0 revealed items', () => {
    const { result } = renderHook(() => useRevealSequence(5));
    expect(result.current.revealedCount).toBe(0);
  });

  it('reveals items one by one with timer', () => {
    const { result } = renderHook(() => useRevealSequence(3));

    // First item reveals after 300ms
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.revealedCount).toBe(1);

    // Next item after revealInterval (950ms)
    act(() => { vi.advanceTimersByTime(950); });
    expect(result.current.revealedCount).toBe(2);

    act(() => { vi.advanceTimersByTime(950); });
    expect(result.current.revealedCount).toBe(3);
  });

  it('stops revealing when all items shown', () => {
    const { result } = renderHook(() => useRevealSequence(1));
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.revealedCount).toBe(1);

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.revealedCount).toBe(1);
  });

  it('reveals all instantly with reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useRevealSequence(5));
    expect(result.current.revealedCount).toBe(5);
  });

  it('getEntryStyle returns opacity 0 for unrevealed', () => {
    const { result } = renderHook(() => useRevealSequence(3));
    const style = result.current.getEntryStyle(0);
    expect(style.opacity).toBe(0);
  });

  it('getEntryStyle returns opacity 1 for revealed', () => {
    const { result } = renderHook(() => useRevealSequence(3));
    act(() => { vi.advanceTimersByTime(300); });
    const style = result.current.getEntryStyle(0);
    expect(style.opacity).toBe(1);
  });

  it('getEntryStyle applies margin variant for tutor types', () => {
    const { result } = renderHook(() => useRevealSequence(3));
    const style = result.current.getEntryStyle(2, 'tutor-marginalia');
    expect(style.transform).toContain('translateX');
  });

  it('getEntryStyle uses instant for divider type', () => {
    const { result } = renderHook(() => useRevealSequence(3));
    const style = result.current.getEntryStyle(2, 'divider');
    expect(style.opacity).toBe(1);
  });
});
