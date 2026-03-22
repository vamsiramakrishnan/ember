/**
 * useSessionIndexer — indexes ALL notebook content into File Search
 * when a notebook is opened. Enables the tutor to recall and search
 * across the student's entire intellectual history.
 *
 * Indexes:
 * - Past session dialogues (entries)
 * - Lexicon (vocabulary)
 * - Encounters (thinker history)
 * - Library (primary texts)
 * - Mastery (concept progression)
 * - Curiosities (open questions)
 *
 * Runs once per notebook open. Idempotent — re-indexing replaces docs.
 */
import { useEffect, useRef } from 'react';
import { isGeminiAvailable, getGeminiClient } from '@/services/gemini';
import {
  getOrCreateStore,
  indexSession,
  indexLexicon,
  indexEncounters,
  indexLibrary,
  indexMastery,
  indexCuriosities,
} from '@/services/file-search';
import { useStudent } from '@/contexts/StudentContext';
import { getEntriesBySession } from '@/persistence/repositories/entries';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import type { SessionRecord } from '@/persistence/records';

export function useSessionIndexer(
  pastSessions: SessionRecord[],
) {
  const { student, notebook } = useStudent();
  const indexedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!student || !notebook) return;
    if (!isGeminiAvailable() || !getGeminiClient()) return;
    // Only index once per notebook
    if (indexedRef.current === notebook.id) return;
    indexedRef.current = notebook.id;

    const indexAll = async () => {
      try {
        const storeName = await getOrCreateStore(student.id);

        // Index sessions in parallel
        await Promise.allSettled(
          pastSessions.map(async (session) => {
            const records = await getEntriesBySession(session.id);
            const entries = records.map((r) => ({
              type: r.entry.type,
              content: 'content' in r.entry ? r.entry.content : undefined,
            }));
            await indexSession(storeName, notebook.id, {
              number: session.number,
              date: session.date,
              topic: session.topic,
              entries,
            });
          }),
        );

        // Index constellation data in parallel
        const [lexicon, encounters, library, mastery, curiosities] = await Promise.all([
          getLexiconByNotebook(notebook.id),
          getEncountersByNotebook(notebook.id),
          getLibraryByNotebook(notebook.id),
          getMasteryByNotebook(notebook.id),
          getCuriositiesByNotebook(notebook.id),
        ]);

        await Promise.allSettled([
          indexLexicon(storeName, notebook.id, lexicon),
          indexEncounters(storeName, notebook.id, encounters),
          indexLibrary(storeName, notebook.id, library),
          indexMastery(storeName, notebook.id, mastery),
          indexCuriosities(
            storeName,
            notebook.id,
            curiosities.map((c) => c.question),
          ),
        ]);
      } catch (err) {
        console.error('[Ember] Content indexing error:', err);
      }
    };

    void indexAll();
  }, [student, notebook, pastSessions]);
}
