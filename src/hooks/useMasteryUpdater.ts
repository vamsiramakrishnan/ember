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
 */
import { useCallback, useRef } from 'react';
import { Store, notify } from '@/persistence';
import { upsertMastery } from '@/persistence/repositories/mastery';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useStudent } from '@/contexts/StudentContext';
import { extractMasterySignals } from '@/services/mastery-extractor';
import type { LiveEntry } from '@/types/entries';

const UPDATE_INTERVAL = 5;

export function useMasteryUpdater() {
  const { student, notebook } = useStudent();
  const entryCountRef = useRef(0);
  const runningRef = useRef(false);

  const checkAndUpdate = useCallback(async (entries: LiveEntry[]) => {
    if (!student || !notebook) return;
    entryCountRef.current++;
    if (entryCountRef.current % UPDATE_INTERVAL !== 0) return;
    if (runningRef.current) return;

    runningRef.current = true;
    try {
      const recent = entries.slice(-10).map((le) => ({
        type: le.entry.type,
        content: 'content' in le.entry ? le.entry.content : undefined,
      }));

      const signals = await extractMasterySignals(recent);
      if (!signals) return;

      // Update mastery concepts
      for (const concept of signals.concepts) {
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
      if (signals.newTerms.length > 0) {
        const existing = await getLexiconByNotebook(notebook.id);
        const existingTerms = new Set(existing.map((e) => e.term.toLowerCase()));
        const nextNumber = existing.length + 1;

        let added = 0;
        for (const term of signals.newTerms) {
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
      if (signals.encounters.length > 0) {
        const existing = await getEncountersByNotebook(notebook.id);
        const existingThinkers = new Set(existing.map((e) => e.thinker.toLowerCase()));
        const nextRef = existing.length + 1;

        let added = 0;
        for (const enc of signals.encounters) {
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
    } catch (err) {
      console.error('[Ember] Mastery update error:', err);
    } finally {
      runningRef.current = false;
    }
  }, [student, notebook]);

  return { checkAndUpdate };
}
