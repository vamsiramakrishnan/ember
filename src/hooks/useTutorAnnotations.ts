/**
 * useTutorAnnotations — the AI proactively annotates student blocks.
 *
 * After the tutor responds to the conversation, it also looks at
 * recent student blocks and decides if any deserve a margin note.
 * Uses File Search to discover relevant context from the student's
 * intellectual history.
 *
 * Annotations feel like finding pencil notes in a library book —
 * quiet, thoughtful, discovered rather than pushed.
 *
 * Runs every 8 entries. Annotates at most 1 block per cycle.
 * Debounced and rate-limited to prevent annotation fatigue.
 */
import { useCallback, useRef } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { TUTOR_AGENT } from '@/services/agents';
import { runTextAgent } from '@/services/run-agent';
import {
  getOrCreateStore,
  searchNotebook,
} from '@/services/file-search';
import { useStudent } from '@/contexts/StudentContext';
import { createId } from '@/persistence/ids';
import type { LiveEntry, EntryAnnotation } from '@/types/entries';

const CYCLE_INTERVAL = 8; // Annotate every 8 entries
const COOLDOWN_MS = 60_000; // 60s between annotation cycles

interface UseTutorAnnotationsOptions {
  onAnnotate: (entryId: string, annotation: EntryAnnotation) => void;
}

export function useTutorAnnotations({ onAnnotate }: UseTutorAnnotationsOptions) {
  const { student, notebook } = useStudent();
  const countRef = useRef(0);
  const lastRunRef = useRef(0);
  const runningRef = useRef(false);

  const maybeAnnotate = useCallback(async (entries: LiveEntry[]) => {
    if (!isGeminiAvailable() || !student || !notebook) return;
    countRef.current++;
    if (countRef.current % CYCLE_INTERVAL !== 0) return;
    if (Date.now() - lastRunRef.current < COOLDOWN_MS) return;
    if (runningRef.current) return;

    runningRef.current = true;
    lastRunRef.current = Date.now();

    try {
      // Find recent student blocks worth annotating
      const studentBlocks = entries
        .filter((le) => ['prose', 'hypothesis', 'question', 'code-cell'].includes(le.entry.type))
        .filter((le) => !le.annotations?.some((a) => a.author === 'tutor'))
        .slice(-5);

      if (studentBlocks.length === 0) return;

      // Pick the most interesting block (longest content)
      const target = studentBlocks.reduce((best, curr) => {
        const bestLen = 'content' in best.entry ? best.entry.content.length : 0;
        const currLen = 'content' in curr.entry ? curr.entry.content.length : 0;
        return currLen > bestLen ? curr : best;
      });

      const targetContent = 'content' in target.entry ? target.entry.content : '';
      if (!targetContent || targetContent.length < 20) return;

      // Search File Search for relevant context
      let context = '';
      try {
        const store = await getOrCreateStore(student.id);
        const result = await searchNotebook(
          store,
          `The student wrote: "${targetContent}". Find relevant past learning, vocabulary, or thinker connections that would enrich this thought.`,
          notebook.id,
        );
        if (result.text.trim()) {
          context = `[Relevant from student's history]: ${result.text}`;
        }
      } catch {
        // File search failed — annotate without context
      }

      // Ask tutor to annotate
      const prompt = `${context ? context + '\n\n' : ''}The student wrote this in their notebook:

"${targetContent}"

Write a brief margin annotation (1 sentence max) that:
- Points to a connection the student hasn't made yet
- References something specific from their past learning if available
- Adds depth without being preachy

Return ONLY the annotation text, no JSON, no quotes.`;

      const result = await runTextAgent(TUTOR_AGENT, [
        { role: 'user', parts: [{ text: prompt }] },
      ]);

      const annotationText = result.text.trim();
      if (annotationText && annotationText.length < 200) {
        const annotation: EntryAnnotation = {
          id: createId(),
          author: 'tutor',
          content: annotationText,
          timestamp: Date.now(),
        };
        onAnnotate(target.id, annotation);
      }
    } catch (err) {
      console.error('[Ember] Tutor annotation error:', err);
    } finally {
      runningRef.current = false;
    }
  }, [student, notebook, onAnnotate]);

  return { maybeAnnotate };
}
