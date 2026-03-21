/**
 * useStore — React hook for reactive reads from IndexedDB stores.
 * Subscribes to store change notifications; re-fetches on writes.
 * Returns { data, loading, error, refresh }.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribe } from './emitter';
import type { StoreName } from './schema';

interface StoreResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Subscribe to a persistence store and keep React state in sync.
 * @param store — which IndexedDB store to watch
 * @param fetcher — async function that reads from the store
 * @param initial — initial value before first fetch completes
 */
export function useStore<T>(
  store: StoreName,
  fetcher: () => Promise<T>,
  initial: T,
): StoreResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => {
    setLoading(true);
    fetcherRef.current()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    return subscribe(store, refresh);
  }, [store, refresh]);

  return { data, loading, error, refresh };
}

/**
 * useStoreQuery — like useStore but for parameterized queries.
 * Re-fetches when deps change.
 */
export function useStoreQuery<T>(
  store: StoreName,
  fetcher: () => Promise<T>,
  initial: T,
  deps: unknown[],
): StoreResult<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => {
    setLoading(true);
    fetcherRef.current()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refresh();
    return subscribe(store, refresh);
  }, [store, refresh]);

  return { data, loading, error, refresh };
}
