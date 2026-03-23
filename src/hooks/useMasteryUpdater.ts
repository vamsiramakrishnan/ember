/**
 * useMasteryUpdater — periodically extracts mastery signals from
 * the conversation and updates IndexedDB. Runs every 5 new entries.
 *
 * Now also auto-creates constellation data:
 * - Mastery records (concept + level + percentage)
 * - Lexicon entries (new vocabulary from conversation)
 * - Encounter records (thinkers mentioned or introduced)
 *
 * All scoped to the current notebook.
 *
 * Fixes:
 * - Proper async guard using AbortController instead of boolean ref
 * - Cached existing terms/thinkers Set to avoid redundant queries
 * - Cleanup on unmount
 */
import { useCallback, useRef, useEffect } from 'react';
import { Store, notify } from '@/persistence';
import { upsertMastery } from '@/persistence/repositories/mastery';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useStudent } from '@/contexts/StudentContext';
import { extractMasterySignals } from '@/services/mastery-extractor';
import { enrichNotebookMetadata } from '@/services/notebook-enrichment';
import type { LiveEntry } from '@/types/entries';

const UPDATE_INTERVAL = 5;

export function useMasteryUpdater() {
  const { student, notebook } = useStudent();
  const entryCountRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup in-flight mastery extraction on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const checkAndUpdate = useCallback(async (entries: LiveEntry[]) => {
    if (!student || !notebook) return;
    entryCountRef.current++;
    if (entryCountRef.current % UPDATE_INTERVAL !== 0) return;

    // Abort any in-flight extraction before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const recent = entries.slice(-10).map((le) => ({
        type: le.entry.type,
        content: 'content' in le.entry ? le.entry.content : undefined,
      }));

      const signals = await extractMasterySignals(recent);
      if (!signals || controller.signal.aborted) return;

      // Update mastery concepts
      for (const concept of signals.concepts) {
        if (controller.signal.aborted) return;
        await upsertMastery({
          studentId: student.id,
          notebookId: notebook.id,
          concept: concept.concept,
          level: concept.level,
          percentage: concept.percentage,
        });
      }
      notify(Store.Mastery);

      // Auto-create lexicon entries from new terms
      if (signals.newTerms.length > 0 && !controller.signal.aborted) {
        const existing = await getLexiconByNotebook(notebook.id);
        const existingTerms = new Set(existing.map((e) => e.term.toLowerCase()));
        const nextNumber = existing.length + 1;

        let added = 0;
        for (const term of signals.newTerms) {
          if (controller.signal.aborted) return;
          if (existingTerms.has(term.term.toLowerCase())) continue;
          await createLexiconEntry({
            studentId: student.id,
            notebookId: notebook.id,
            number: nextNumber + added,
            term: term.term,
            pronunciation: '',
            definition: term.definition,
            level: 'exploring',
            percentage: 10,
            etymology: term.etymology ?? '',
            crossReferences: [],
          });
          added++;
        }
        if (added > 0) notify(Store.Lexicon);
      }

      // Auto-create encounter records from mentioned thinkers
      if (signals.encounters.length > 0 && !controller.signal.aborted) {
        const existing = await getEncountersByNotebook(notebook.id);
        const existingThinkers = new Set(existing.map((e) => e.thinker.toLowerCase()));
        const nextRef = existing.length + 1;

        let added = 0;
        for (const enc of signals.encounters) {
          if (controller.signal.aborted) return;
          if (existingThinkers.has(enc.thinker.toLowerCase())) continue;
          await createEncounter({
            studentId: student.id,
            notebookId: notebook.id,
            ref: String(nextRef + added).padStart(3, '0'),
            thinker: enc.thinker,
            tradition: '',
            coreIdea: enc.coreIdea,
            sessionTopic: '',
            date: new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            }),
            status: 'active',
          });
          added++;
        }
        if (added > 0) notify(Store.Encounters);
      }

      // Enrich notebook metadata after first cycle
      if (entryCountRef.current === UPDATE_INTERVAL && !controller.signal.aborted) {
        const textEntries = entries
          .filter((le) => 'content' in le.entry)
          .map((le) => ('content' in le.entry ? le.entry.content : ''));
        void enrichNotebookMetadata(
          notebook.id, notebook.title, notebook.description, textEntries,
        );
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[Ember] Mastery update error:', err);
      }
    }
  }, [student, notebook]);

  return { checkAndUpdate };
}
