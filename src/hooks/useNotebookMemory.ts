/**
 * useNotebookMemory — semantic search across the student's notebook history.
 * Powers cross-session echoes, deep connections, and the long game.
 * Uses Gemini File Search (managed RAG) to index and query past sessions.
 */
import { useCallback, useRef, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import {
  getOrCreateStore,
  indexSession,
  searchNotebooks,
} from '@/services/gemini-file-search';

const STUDENT_ID = 'default';

export interface MemorySearchResult {
  text: string;
  citations: string[];
}

export function useNotebookMemory() {
  const [indexing, setIndexing] = useState(false);
  const [searching, setSearching] = useState(false);
  const storeRef = useRef<string | null>(null);

  /** Ensure the store exists, caching the name. */
  const ensureStore = useCallback(async (): Promise<string | null> => {
    if (!isGeminiAvailable()) return null;
    if (storeRef.current) return storeRef.current;
    try {
      const name = await getOrCreateStore(STUDENT_ID);
      storeRef.current = name;
      return name;
    } catch (err) {
      console.error('[Ember] Failed to create store:', err);
      return null;
    }
  }, []);

  /** Index a completed session for future retrieval. */
  const indexCompletedSession = useCallback(async (session: {
    number: number;
    date: string;
    topic: string;
    entries: Array<{ type: string; content?: string }>;
  }) => {
    const store = await ensureStore();
    if (!store) return;

    setIndexing(true);
    try {
      await indexSession(store, session);
    } catch (err) {
      console.error('[Ember] Failed to index session:', err);
    } finally {
      setIndexing(false);
    }
  }, [ensureStore]);

  /** Search across all indexed sessions. */
  const search = useCallback(async (
    query: string,
  ): Promise<MemorySearchResult | null> => {
    const store = await ensureStore();
    if (!store) return null;

    setSearching(true);
    try {
      return await searchNotebooks(store, query);
    } catch (err) {
      console.error('[Ember] Notebook search error:', err);
      return null;
    } finally {
      setSearching(false);
    }
  }, [ensureStore]);

  return {
    indexCompletedSession,
    search,
    indexing,
    searching,
  };
}
