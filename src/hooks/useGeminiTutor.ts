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
 */
import { useCallback, useRef, useState } from 'react';
import type { DeferredAction } from '@/services/tool-executor';
import { isGeminiAvailable } from '@/services/gemini';
import { streamOrchestrate } from '@/services/orchestrator';
import { useStudent } from '@/contexts/StudentContext';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useSessionManager } from '@/hooks/useSessionManager';
import { runBackgroundTasks } from '@/services/background-task-runner';
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
  const { student, notebook } = useStudent();
  const { current } = useSessionManager();

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

      setIsThinking(true);
      const canStream = addEntryWithId && patchEntryContent;

      // Streaming path: the streaming-text entry itself is the
      // thinking indicator — no separate silence marker needed.
      // Non-streaming fallback: add a compact silence marker.
      let streamingId: string | null = null;

      if (canStream) {
        const streamEntry: NotebookEntry = {
          type: 'streaming-text', content: '', done: false,
        };
        const id = addEntryWithId(streamEntry);
        streamingId = typeof id === 'string' ? id : await id;
        setIsStreaming(true);
      } else {
        addEntry({ type: 'silence' });
      }

      try {
        abortRef.current = new AbortController();

        const [profile, notebookCtx] = await Promise.all([
          buildProfile(),
          buildNotebookCtx(),
        ]);

        const onChunk = (_chunk: string, accumulated: string) => {
          if (streamingId && patchEntryContent) {
            patchEntryContent(streamingId, {
              type: 'streaming-text',
              content: accumulated,
              done: false,
            });
          }
        };

        const result = await streamOrchestrate(
          studentEntry.content,
          entries,
          student.id,
          notebook.id,
          onChunk,
          profile,
          notebookCtx,
          lastSyncRef.current,
        );

        lastSyncRef.current = Date.now();

        if (streamingId && patchEntryContent) {
          // Replace streaming entry with the final parsed tutor entry
          const firstEntry = result.entries[0];
          if (firstEntry) {
            patchEntryContent(streamingId, firstEntry);
          }

          // Add remaining entries (enrichment, echoes, etc.)
          for (let i = 1; i < result.entries.length; i++) {
            const entry = result.entries[i];
            if (!entry) continue;
            await delay(600);
            addEntry(entry);
          }
        } else {
          // Non-streaming fallback
          for (let i = 0; i < result.entries.length; i++) {
            const entry = result.entries[i];
            if (!entry) continue;
            if (i > 0) await delay(600);
            addEntry(entry);
          }
        }

        setIsStreaming(false);

        for (const action of result.deferredActions) {
          executeDeferredAction(action, student.id, notebook.id);
        }

        void runBackgroundTasks(
          studentEntry.content,
          result.entries,
          student.id,
          notebook.id,
          current?.topic ?? '',
          entries,
          notebook.title,
        );
      } catch (err) {
        console.error('[Ember] Gemini tutor error:', err);
        setIsStreaming(false);
      } finally {
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [addEntry, addEntryWithId, patchEntryContent, entries,
     student, notebook, buildProfile, buildNotebookCtx, current],
  );

  return { respond, isThinking, isStreaming };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function executeDeferredAction(
  action: DeferredAction,
  _studentId: string,
  _notebookId: string,
): void {
  if (action.type === 'annotate') {
    console.log('[Ember] Agent annotation:', action.args);
  }
  if (action.type === 'add_lexicon') {
    console.log('[Ember] Agent lexicon add:', action.args);
  }
}
