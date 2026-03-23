/**
 * useGeminiTutor — AI-powered tutor responses using multi-agent orchestration.
 *
 * Pipeline per student entry:
 * 1. Router Agent classifies → which agents to invoke
 * 2. Context Assembler builds layered context (profile + memory + research)
 * 3. File Search retrieves relevant history (always-on)
 * 4. Tutor responds with streaming text (tokens appear in real-time)
 * 5. Visualiser/Illustrator produce rich content (when warranted)
 *
 * Falls back gracefully when no API key is configured.
 *
 * State management fixes:
 * - `entries` accessed via ref to avoid dependency cascade
 * - AbortController properly passed and cleaned up on unmount
 * - Guard against concurrent responses via `activeRef`
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import type { DeferredAction } from '@/services/tool-executor';
import { isGeminiAvailable } from '@/services/gemini';
import { streamOrchestrate } from '@/services/orchestrator';
import { useStudent } from '@/contexts/StudentContext';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useSessionManager } from '@/hooks/useSessionManager';
import { runBackgroundTasks } from '@/services/background-task-runner';
import {
  recordTutorTurn, setTutorActivity,
  filterByComposition, addRelation,
} from '@/state';
import type { InteractionMode } from '@/state';
import type { StudentProfile, NotebookContext } from '@/services/context-assembler';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

interface UseGeminiTutorOptions {
  addEntry: (entry: NotebookEntry) => void;
  addEntryWithId?: (entry: NotebookEntry) => string | Promise<string>;
  patchEntryContent?: (id: string, entry: NotebookEntry) => void;
  entries: LiveEntry[];
}

export function useGeminiTutor({
  addEntry, addEntryWithId, patchEntryContent, entries,
}: UseGeminiTutorOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastSyncRef = useRef(Date.now());
  const activeRef = useRef(false);
  const { student, notebook } = useStudent();
  const { current } = useSessionManager();

  // Use refs for values that change frequently but shouldn't
  // recreate the respond callback (breaks the dependency cascade).
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const addEntryRef = useRef(addEntry);
  addEntryRef.current = addEntry;

  const addEntryWithIdRef = useRef(addEntryWithId);
  addEntryWithIdRef.current = addEntryWithId;

  const patchRef = useRef(patchEntryContent);
  patchRef.current = patchEntryContent;

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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

      // Guard: don't start a new response while one is active
      if (activeRef.current) {
        abortRef.current?.abort();
      }
      activeRef.current = true;

      setIsThinking(true);
      setTutorActivity(true, false);

      const canStream = addEntryWithIdRef.current && patchRef.current;
      let streamingId: string | null = null;

      if (canStream) {
        const streamEntry: NotebookEntry = {
          type: 'streaming-text', content: '', done: false,
        };
        const id = addEntryWithIdRef.current!(streamEntry);
        streamingId = typeof id === 'string' ? id : await id;
        setIsStreaming(true);
      } else {
        addEntryRef.current({ type: 'silence' });
      }

      try {
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        const [profile, notebookCtx] = await Promise.all([
          buildProfile(),
          buildNotebookCtx(),
        ]);

        // Check if aborted during profile build
        if (signal.aborted) return;

        const onChunk = (_chunk: string, accumulated: string) => {
          if (signal.aborted) return;
          if (streamingId && patchRef.current) {
            patchRef.current(streamingId, {
              type: 'streaming-text',
              content: accumulated,
              done: false,
            });
          }
        };

        const result = await streamOrchestrate(
          studentEntry.content,
          entriesRef.current,
          student.id,
          notebook.id,
          onChunk,
          profile,
          notebookCtx,
          lastSyncRef.current,
        );

        if (signal.aborted) return;

        lastSyncRef.current = Date.now();

        const filtered = filterByComposition(result.entries, entriesRef.current);

        if (streamingId && patchRef.current) {
          const firstEntry = filtered[0];
          if (firstEntry) {
            patchRef.current(streamingId, firstEntry);
            addRelation({
              from: streamingId, to: streamingId,
              type: 'prompted-by',
              meta: studentEntry.content.slice(0, 80),
            });
            recordTutorTurn(
              inferTutorMode(firstEntry),
              extractTopics(firstEntry),
              firstEntry.type === 'thinker-card' ? firstEntry.thinker.name : undefined,
            );
          }

          for (let i = 1; i < filtered.length; i++) {
            if (signal.aborted) break;
            const entry = filtered[i];
            if (!entry) continue;
            await delay(600);
            addEntryRef.current(entry);
            recordTutorTurn(inferTutorMode(entry));
          }
        } else {
          for (let i = 0; i < filtered.length; i++) {
            if (signal.aborted) break;
            const entry = filtered[i];
            if (!entry) continue;
            if (i > 0) await delay(600);
            addEntryRef.current(entry);
            recordTutorTurn(inferTutorMode(entry));
          }
        }

        setIsStreaming(false);
        setTutorActivity(false, false);

        if (!signal.aborted) {
          for (const action of result.deferredActions) {
            executeDeferredAction(action, student.id, notebook.id);
          }

          void runBackgroundTasks(
            studentEntry.content,
            result.entries,
            student.id,
            notebook.id,
            current?.topic ?? '',
            entriesRef.current,
            notebook.title,
          );
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('[Ember] Gemini tutor error:', err);
        }
        setIsStreaming(false);
        setTutorActivity(false, false);
      } finally {
        setIsThinking(false);
        activeRef.current = false;
        abortRef.current = null;
      }
    },
    // Stable deps only — entries/addEntry/patch accessed via refs
    [student, notebook, buildProfile, buildNotebookCtx, current],
  );

  return { respond, isThinking, isStreaming };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Infer the interaction mode from a tutor entry type. */
function inferTutorMode(entry: NotebookEntry): InteractionMode {
  switch (entry.type) {
    case 'tutor-question': return 'socratic';
    case 'tutor-connection': return 'connection';
    case 'concept-diagram':
    case 'visualization':
    case 'illustration': return 'visual';
    case 'silence': return 'silence';
    default: return 'confirmation';
  }
}

/** Extract topic keywords from a tutor entry. */
function extractTopics(entry: NotebookEntry): string[] {
  if (!('content' in entry) || typeof entry.content !== 'string') return [];
  const matches = entry.content.match(
    /\b[A-Z][a-z]+(?:\s+[a-z]+){0,2}\b/g,
  ) ?? [];
  return matches.slice(0, 3);
}

function executeDeferredAction(
  action: DeferredAction | import('@/services/graph-tools').GraphDeferredAction,
  _studentId: string,
  notebookId: string,
): void {
  if ('type' in action && action.type === 'annotate') {
    console.log('[Ember] Agent annotation:', action.args);
  }
  if ('type' in action && action.type === 'add_lexicon') {
    console.log('[Ember] Agent lexicon add:', action.args);
  }
  if ('type' in action && action.type === 'link_entities') {
    void import('@/services/graph-tools').then(({ executeGraphDeferred }) => {
      executeGraphDeferred({ ...action, notebookId });
    });
  }
}
