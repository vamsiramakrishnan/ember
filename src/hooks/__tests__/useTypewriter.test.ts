/**
 * Tests for useTypewriter — character-by-character text reveal.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '../useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock matchMedia — no reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string when not active', () => {
    const { result } = renderHook(() => useTypewriter('Hello', false));
    expect(result.current).toBe('');
  });

  it('reveals characters one at a time when active', () => {
    const { result } = renderHook(() => useTypewriter('Hi', true, 10));
    expect(result.current).toBe('');

    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe('H');

    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe('Hi');
  });

  it('pauses longer at punctuation', () => {
    const { result } = renderHook(() => useTypewriter('A.B', true, 10));

    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe('A');

    // At '.', pause is speed * 4 = 40ms
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe('A'); // Not yet

    act(() => { vi.advanceTimersByTime(30); });
    expect(result.current).toBe('A.');

    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe('A.B');
  });

  it('reveals all instantly with reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    const { result } = renderHook(() => useTypewriter('Hello', true));
    // With reduced motion, should instantly show full text
    expect(result.current).toBe('Hello');
  });

  it('resets when deactivated', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useTypewriter('Hello', active, 10),
      { initialProps: { active: true } },
    );

    act(() => { vi.advanceTimersByTime(20); });
    expect(result.current.length).toBeGreaterThan(0);

    rerender({ active: false });
    expect(result.current).toBe('');
  });
});
