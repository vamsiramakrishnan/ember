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
  searchAll,
  searchNotebook,
} from '@/services/file-search';
import { useStudent } from '@/contexts/StudentContext';

export interface MemorySearchResult {
  text: string;
  citations: string[];
}

export function useNotebookMemory() {
  const { student, notebook } = useStudent();
  const [indexing, setIndexing] = useState(false);
  const [searching, setSearching] = useState(false);
  const storeRef = useRef<string | null>(null);

  const ensureStore = useCallback(async (): Promise<string | null> => {
    if (!isGeminiAvailable() || !student) return null;
    if (storeRef.current) return storeRef.current;
    try {
      const name = await getOrCreateStore(student.id);
      storeRef.current = name;
      return name;
    } catch (err) {
      console.error('[Ember] Failed to create store:', err);
      return null;
    }
  }, [student]);

  /** Index a completed session for future retrieval. */
  const indexCompletedSession = useCallback(async (session: {
    number: number;
    date: string;
    topic: string;
    entries: Array<{ type: string; content?: string }>;
  }) => {
    const store = await ensureStore();
    if (!store || !notebook) return;

    setIndexing(true);
    try {
      await indexSession(store, notebook.id, session);
    } catch (err) {
      console.error('[Ember] Failed to index session:', err);
    } finally {
      setIndexing(false);
    }
  }, [ensureStore, notebook]);

  /** Search across all indexed content (all notebooks). */
  const search = useCallback(async (
    query: string,
  ): Promise<MemorySearchResult | null> => {
    const store = await ensureStore();
    if (!store) return null;

    setSearching(true);
    try {
      return await searchAll(store, query);
    } catch (err) {
      console.error('[Ember] Notebook search error:', err);
      return null;
    } finally {
      setSearching(false);
    }
  }, [ensureStore]);

  /** Search within the current notebook only. */
  const searchCurrentNotebook = useCallback(async (
    query: string,
  ): Promise<MemorySearchResult | null> => {
    const store = await ensureStore();
    if (!store || !notebook) return null;

    setSearching(true);
    try {
      return await searchNotebook(store, query, notebook.id);
    } catch (err) {
      console.error('[Ember] Notebook search error:', err);
      return null;
    } finally {
      setSearching(false);
    }
  }, [ensureStore, notebook]);

  return {
    indexCompletedSession,
    search,
    searchCurrentNotebook,
    indexing,
    searching,
  };
}
