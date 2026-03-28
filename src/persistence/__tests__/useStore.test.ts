/**
 * Tests for useStore — reactive IndexedDB hooks.
 */
import { describe, test, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../emitter', () => ({
  subscribe: vi.fn().mockReturnValue(() => {}),
}));

import { useStore, useStoreQuery } from '../useStore';

describe('useStore', () => {
  test('returns initial value while loading', () => {
    const { result } = renderHook(() =>
      useStore('entries', () => Promise.resolve(['data']), []),
    );
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  test('fetches and updates data', async () => {
    const { result } = renderHook(() =>
      useStore('entries', () => Promise.resolve(['item1']), []),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['item1']);
    expect(result.current.error).toBeNull();
  });

  test('sets error on fetch failure', async () => {
    const { result } = renderHook(() =>
      useStore('entries', () => Promise.reject(new Error('fail')), []),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  test('exposes refresh function', () => {
    const { result } = renderHook(() =>
      useStore('entries', () => Promise.resolve([]), []),
    );
    expect(typeof result.current.refresh).toBe('function');
  });
});

describe('useStoreQuery', () => {
  test('returns initial value while loading', () => {
    const { result } = renderHook(() =>
      useStoreQuery('entries', () => Promise.resolve('data'), '', ['dep']),
    );
    expect(result.current.data).toBe('');
    expect(result.current.loading).toBe(true);
  });
});
