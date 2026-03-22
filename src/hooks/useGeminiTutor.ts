/**
 * useGeminiTutor — AI-powered tutor responses using multi-agent orchestration.
 *
 * Pipeline per student entry:
 * 1. Router Agent classifies → which agents to invoke
 * 2. Context Assembler builds layered context (profile + memory + research)
 * 3. File Search retrieves relevant history (always-on)
 * 4. Tutor responds with enriched context
 * 5. Visualiser/Illustrator produce rich content (when warranted)
 *
 * Falls back gracefully when no API key is configured.
 */
import { useCallback, useRef, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { orchestrate } from '@/services/orchestrator';
import { useStudent } from '@/contexts/StudentContext';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useSessionManager } from '@/hooks/useSessionManager';
import type { StudentProfile, NotebookContext } from '@/services/context-assembler';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

interface UseGeminiTutorOptions {
  addEntry: (entry: NotebookEntry) => void;
  entries: LiveEntry[];
}

export function useGeminiTutor({ addEntry, entries }: UseGeminiTutorOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { student, notebook } = useStudent();
  const { current } = useSessionManager();

  /** Build student profile from persisted data. */
  const buildProfile = useCallback(async (): Promise<StudentProfile | null> => {
    if (!student || !notebook) return null;

    const [mastery, lexicon, curiosities] = await Promise.all([
      getMasteryByNotebook(notebook.id),
      getLexiconByNotebook(notebook.id),
      getCuriositiesByNotebook(notebook.id),
    ]);

    return {
      name: student.displayName,
      masterySnapshot: mastery.map((m) => ({
        concept: m.concept, level: m.level, percentage: m.percentage,
      })),
      vocabularyCount: lexicon.length,
      activeCuriosities: curiosities.map((c) => c.question),
      totalMinutes: student.totalMinutes,
    };
  }, [student, notebook]);

  /** Build notebook context from current state. */
  const buildNotebookCtx = useCallback(async (): Promise<NotebookContext | null> => {
    if (!notebook || !current) return null;

    const encounters = await getEncountersByNotebook(notebook.id);

    return {
      title: notebook.title,
      description: notebook.description,
      sessionNumber: current.number,
      sessionTopic: current.topic,
      thinkersMet: encounters.map((e) => e.thinker),
    };
  }, [notebook, current]);

  const respond = useCallback(
    async (studentEntry: NotebookEntry) => {
      if (!isGeminiAvailable()) return;
      if (!('content' in studentEntry)) return;
      if (!student || !notebook) return;

      const silence: NotebookEntry = { type: 'silence' };
      addEntry(silence);
      setIsThinking(true);

      try {
        abortRef.current = new AbortController();

        // Build profile and notebook context in parallel
        const [profile, notebookCtx] = await Promise.all([
          buildProfile(),
          buildNotebookCtx(),
        ]);

        const result = await orchestrate(
          studentEntry.content,
          entries,
          student.id,
          notebook.id,
          profile,
          notebookCtx,
        );

        // Stagger entry additions for natural feel
        for (let i = 0; i < result.entries.length; i++) {
          const entry = result.entries[i];
          if (!entry) continue;
          if (i > 0) await delay(800);
          addEntry(entry);
        }
      } catch (err) {
        console.error('[Ember] Gemini tutor error:', err);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [addEntry, entries, student, notebook, buildProfile, buildNotebookCtx],
  );

  return { respond, isThinking };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
