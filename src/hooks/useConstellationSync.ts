/**
 * useConstellationSync — watches notebook entries and automatically
 * creates constellation records when the AI tutor introduces content:
 *
 * - thinker-card entries → Encounter records
 * - concept-diagram entries → Mastery records (exploring level)
 * - bridge-suggestion entries → Curiosity records
 *
 * This bridges the gap between "what appears in the notebook" and
 * "what shows up in the constellation." The tutor's work is not lost.
 */
import { useEffect, useRef } from 'react';
import { Store, notify } from '@/persistence';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { upsertMastery } from '@/persistence/repositories/mastery';
import { createCuriosity, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { useStudent } from '@/contexts/StudentContext';
import type { LiveEntry } from '@/types/entries';

export function useConstellationSync(entries: LiveEntry[]) {
  const { student, notebook } = useStudent();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!student || !notebook || entries.length === 0) return;

    const process = async () => {
      for (const le of entries) {
        if (processedRef.current.has(le.id)) continue;
        processedRef.current.add(le.id);

        // Thinker cards → Encounters
        if (le.entry.type === 'thinker-card') {
          const { thinker } = le.entry;
          const existing = await getEncountersByNotebook(notebook.id);
          const already = existing.some(
            (e) => e.thinker.toLowerCase() === thinker.name.toLowerCase(),
          );
          if (!already) {
            await createEncounter({
              studentId: student.id,
              notebookId: notebook.id,
              ref: String(existing.length + 1).padStart(3, '0'),
              thinker: thinker.name,
              tradition: '',
              coreIdea: thinker.gift,
              sessionTopic: '',
              date: new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              }),
              status: 'active',
            });
            notify(Store.Encounters);
          }
        }

        // Concept diagrams → Mastery (exploring level)
        if (le.entry.type === 'concept-diagram') {
          for (const item of le.entry.items) {
            await upsertMastery({
              studentId: student.id,
              notebookId: notebook.id,
              concept: item.label,
              level: 'exploring',
              percentage: 15,
            });
          }
          notify(Store.Mastery);
        }

        // Bridge suggestions → Curiosity threads
        if (le.entry.type === 'bridge-suggestion') {
          const existing = await getCuriositiesByNotebook(notebook.id);
          const content = le.entry.content;
          const already = existing.some(
            (c) => c.question === content,
          );
          if (!already) {
            await createCuriosity({
              studentId: student.id,
              notebookId: notebook.id,
              question: content,
            });
            notify(Store.Curiosities);
          }
        }
      }
    };

    void process();
  }, [entries, student, notebook]);
}
