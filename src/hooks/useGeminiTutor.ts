/**
 * useGeminiTutor — AI-powered tutor responses via multi-agent orchestration.
 * Routes student entries through context assembly, streaming response,
 * and deferred background tasks. Falls back when no API key is configured.
 * Entries/addEntry accessed via refs to avoid dependency cascade.
 */
import { useCallback, useRef, useState, useEffect } from 'react';
import { isGeminiAvailable } from '@/services/gemini';
import { streamOrchestrate } from '@/services/orchestrator';
import { runBackgroundTasks } from '@/services/background-task-runner';
import { updateWorkingMemory } from '@/services/working-memory';
import { enqueueTask, PRIORITY } from '@/services/task-queue';
import {
  recordTutorTurn, setTutorActivity,
  filterByComposition, addRelation,
} from '@/state';
import { useTutorProfile } from './useTutorProfile';
import { useCompoundResponse } from './useCompoundResponse';
import { delay, inferTutorMode, extractTopics, executeDeferredAction } from './tutor-helpers';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { ResponsePlan } from './useResponseOrchestrator';

interface UseGeminiTutorOptions {
  addEntry: (entry: NotebookEntry) => void;
  addEntryWithId?: (entry: NotebookEntry) => string | Promise<string>;
  patchEntryContent?: (id: string, entry: NotebookEntry) => void;
  entries: LiveEntry[];
  pinnedEntries?: LiveEntry[];
  sessionTopic?: string | null;
  studentId?: string;
  notebookId?: string;
  onPlanUpdate?: (plans: ResponsePlan[]) => void;
}

export function useGeminiTutor({
  addEntry, addEntryWithId, patchEntryContent, entries,
  pinnedEntries, sessionTopic, onPlanUpdate,
}: UseGeminiTutorOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastSyncRef = useRef(Date.now());
  const activeRef = useRef(false);
  const { buildProfile, buildNotebookCtx, student, notebook, current } = useTutorProfile();
  const compound = useCompoundResponse();

  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const addEntryRef = useRef(addEntry);
  addEntryRef.current = addEntry;
  const addEntryWithIdRef = useRef(addEntryWithId);
  addEntryWithIdRef.current = addEntryWithId;
  const patchRef = useRef(patchEntryContent);
  patchRef.current = patchEntryContent;
  const pinnedRef = useRef(pinnedEntries ?? []);
  pinnedRef.current = pinnedEntries ?? [];
  const planCallbackRef = useRef(onPlanUpdate);
  planCallbackRef.current = onPlanUpdate;

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const respond = useCallback(
    async (studentEntry: NotebookEntry) => {
      if (!isGeminiAvailable() || !('content' in studentEntry) || !student || !notebook) return;
      if (activeRef.current) abortRef.current?.abort();
      activeRef.current = true;
      setIsThinking(true);
      setTutorActivity(true, false);

      // ─── Compound path: detect multi-intent and delegate to DAG ───
      const text = (studentEntry as { content: string }).content;
      if (compound.isLikelyCompound(text) && addEntryWithIdRef.current && patchRef.current) {
        try {
          const dag = await compound.executeCompound(text, {
            addEntry: addEntryRef.current,
            addEntryWithId: addEntryWithIdRef.current,
            patchEntryContent: patchRef.current,
            entries: entriesRef.current,
            pinnedEntries: pinnedRef.current,
            sessionTopic: sessionTopic ?? current?.topic ?? null,
            studentId: student.id,
            notebookId: notebook.id,
          }, (plans: ResponsePlan[]) => planCallbackRef.current?.(plans));

          if (dag) {
            // DAG handled it — skip single-response path
            setIsThinking(false);
            setTutorActivity(false, false);
            activeRef.current = false;
            void runBackgroundTasks(text, [], student.id, notebook.id, current?.topic ?? '', entriesRef.current, notebook.title);
            enqueueTask({
              key: `working-memory:${notebook.id}:${Date.now()}`,
              label: 'compressing session',
              priority: PRIORITY.HIGH,
              timeoutMs: 15_000,
              group: 'post-response',
              run: async () => { await updateWorkingMemory(notebook.id, entriesRef.current); },
            });
            return;
          }
          // DAG returned null (not compound) — fall through to normal path
        } catch (err) {
          console.warn('[Ember] Compound parse failed, using single path:', err);
        }
      }

      const canStream = addEntryWithIdRef.current && patchRef.current;
      let streamingId: string | null = null;

      if (canStream) {
        const id = addEntryWithIdRef.current!({ type: 'streaming-text', content: '', done: false });
        streamingId = typeof id === 'string' ? id : await id;
        setIsStreaming(true);
      } else {
        addEntryRef.current({ type: 'silence' });
      }

      try {
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        const [profile, notebookCtx] = await Promise.all([buildProfile(), buildNotebookCtx()]);
        if (signal.aborted) return;

        const onChunk = (_chunk: string, accumulated: string) => {
          if (signal.aborted || !streamingId || !patchRef.current) return;
          patchRef.current(streamingId, { type: 'streaming-text', content: accumulated, done: false });
        };

        const result = await streamOrchestrate(
          studentEntry.content, entriesRef.current, student.id, notebook.id,
          onChunk, profile, notebookCtx, lastSyncRef.current, signal,
        );
        if (signal.aborted) return;
        lastSyncRef.current = Date.now();

        const filtered = filterByComposition(result.entries, entriesRef.current);
        await revealEntries(filtered, streamingId, signal, studentEntry, addEntryRef, patchRef);

        setIsStreaming(false);
        setTutorActivity(false, false);

        if (!signal.aborted) {
          // Deferred actions (graph writes, lexicon adds) → P0 via queue
          for (const action of result.deferredActions) {
            enqueueTask({
              key: `deferred:${action.type}:${Date.now()}`,
              label: `deferred ${action.type}`,
              priority: PRIORITY.CRITICAL,
              retries: 1,
              timeoutMs: 10_000,
              group: 'post-response',
              run: async () => { executeDeferredAction(action, student.id, notebook.id); },
            });
          }

          // Background tasks (mastery, extraction, annotations) → queued by priority
          void runBackgroundTasks(
            studentEntry.content, result.entries, student.id, notebook.id,
            current?.topic ?? '', entriesRef.current, notebook.title,
          );

          // Working memory compression → P1 via queue
          enqueueTask({
            key: `working-memory:${notebook.id}:${Date.now()}`,
            label: 'compressing session',
            priority: PRIORITY.HIGH,
            timeoutMs: 15_000,
            group: 'post-response',
            run: async () => { await updateWorkingMemory(notebook.id, entriesRef.current); },
          });
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') console.error('[Ember] Gemini tutor error:', err);
        setIsStreaming(false);
        setTutorActivity(false, false);
      } finally {
        setIsThinking(false);
        activeRef.current = false;
        abortRef.current = null;
      }
    },
    [student, notebook, buildProfile, buildNotebookCtx, current],
  );

  return { respond, isThinking, isStreaming };
}

/** Reveal filtered entries one-by-one with staggered delays. */
async function revealEntries(
  filtered: NotebookEntry[],
  streamingId: string | null,
  signal: AbortSignal,
  studentEntry: NotebookEntry & { content: string },
  addEntryRef: React.MutableRefObject<(e: NotebookEntry) => void>,
  patchRef: React.MutableRefObject<((id: string, e: NotebookEntry) => void) | undefined>,
): Promise<void> {
  if (streamingId && patchRef.current) {
    const first = filtered[0];
    if (first) {
      patchRef.current(streamingId, first);
      addRelation({ from: streamingId, to: streamingId, type: 'prompted-by', meta: studentEntry.content.slice(0, 80) });
      recordTutorTurn(inferTutorMode(first), extractTopics(first), first.type === 'thinker-card' ? first.thinker.name : undefined);
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
}
