/**
 * useGeminiTutor — AI-powered tutor responses using multi-agent orchestration.
 *
 * Routes through the orchestrator which decides:
 * - Tutor agent (always) — Socratic dialogue
 * - Researcher agent — when factual depth is needed
 * - Visualiser agent — when student asks for diagrams/visuals
 * - Illustrator agent — when student asks for sketches
 * - File Search — when student references past sessions
 *
 * Falls back gracefully when no API key is configured.
 */
import { useCallback, useRef, useState } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { orchestrate } from '@/services/orchestrator';
import { useStudent } from '@/contexts/StudentContext';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

interface UseGeminiTutorOptions {
  addEntry: (entry: NotebookEntry) => void;
  entries: LiveEntry[];
}

export function useGeminiTutor({ addEntry, entries }: UseGeminiTutorOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { student } = useStudent();

  const respond = useCallback(
    async (studentEntry: NotebookEntry) => {
      if (!isGeminiAvailable()) return;
      if (!('content' in studentEntry)) return;
      if (!student) return;

      const silence: NotebookEntry = { type: 'silence' };
      addEntry(silence);
      setIsThinking(true);

      try {
        abortRef.current = new AbortController();

        const result = await orchestrate(
          studentEntry.content,
          entries,
          student.id,
        );

        // Add each entry with staggered timing for natural feel
        for (let i = 0; i < result.entries.length; i++) {
          const entry = result.entries[i];
          if (!entry) continue;

          if (i > 0) {
            // Stagger subsequent entries (visualizations, illustrations)
            await delay(800);
          }
          addEntry(entry);
        }
      } catch (err) {
        console.error('[Ember] Gemini tutor error:', err);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [addEntry, entries, student],
  );

  return { respond, isThinking };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
