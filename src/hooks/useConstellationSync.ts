/**
 * useConstellationSync — watches notebook entries and automatically
 * creates constellation records via declarative projections.
 *
 * Uses ConstellationProjection to map entry types to constellation
 * records (encounters, mastery, curiosities), keeping the logic
 * centralized and testable.
 *
 * Traces to:
 * - Principle III (Mastery is Invisible): projections are automatic
 * - 04-information-architecture.md: constellation reflects notebook
 */
import { useEffect, useRef } from 'react';
import { Store, notify } from '@/persistence';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { upsertMastery } from '@/persistence/repositories/mastery';
import { createCuriosity, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { useStudent } from '@/contexts/StudentContext';
import { projectEntry } from '@/state';
import type { LiveEntry } from '@/types/entries';

export function useConstellationSync(entries: LiveEntry[]) {
  const { student, notebook } = useStudent();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!student || !notebook || entries.length === 0) return;

    const process = async () => {
      let encountersChanged = false;
      let masteryChanged = false;
      let curiositiesChanged = false;

      for (const le of entries) {
        if (processedRef.current.has(le.id)) continue;
        processedRef.current.add(le.id);

        // Use declarative projection
        const projection = projectEntry(le);

        // Apply encounter projections
        for (const enc of projection.encounters) {
          const existing = await getEncountersByNotebook(notebook.id);
          const already = existing.some(
            (e) => e.thinker.toLowerCase() === enc.thinkerName.toLowerCase(),
          );
          if (!already) {
            await createEncounter({
              studentId: student.id,
              notebookId: notebook.id,
              ref: String(existing.length + 1).padStart(3, '0'),
              thinker: enc.thinkerName,
              tradition: '',
              coreIdea: enc.coreIdea,
              sessionTopic: '',
              date: new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              }),
              status: 'active',
            });
            encountersChanged = true;
          }
        }

        // Apply mastery projections
        for (const mas of projection.mastery) {
          await upsertMastery({
            studentId: student.id,
            notebookId: notebook.id,
            concept: mas.concept,
            level: mas.level,
            percentage: mas.percentage,
          });
          masteryChanged = true;
        }

        // Apply curiosity projections
        for (const cur of projection.curiosities) {
          const existing = await getCuriositiesByNotebook(notebook.id);
          const already = existing.some(
            (c) => c.question === cur.question,
          );
          if (!already) {
            await createCuriosity({
              studentId: student.id,
              notebookId: notebook.id,
              question: cur.question,
            });
            curiositiesChanged = true;
          }
        }
      }

      // Batch notifications
      if (encountersChanged) notify(Store.Encounters);
      if (masteryChanged) notify(Store.Mastery);
      if (curiositiesChanged) notify(Store.Curiosities);
    };

    void process();
  }, [entries, student, notebook]);
}
