/**
 * useCompoundResponse — handles compound (multi-intent) student inputs.
 *
 * Architecture: each DAG node gets its own streaming-text entry,
 * fully isolated. Wave-parallel nodes stream concurrently into
 * different entries. No node blocks another.
 *
 * Integration pattern:
 *   useGeminiTutor detects compound input → delegates here
 *   Each node creates its own streaming placeholder
 *   Nodes execute via dag-executor with per-node abort
 *   Results patch their own entry independently
 *   Composition guard runs per-entry
 *
 * Performance model:
 *   - DAG parse: ~100ms (Flash Lite, structured output)
 *   - Node dispatch: async, concurrent within wave
 *   - Streaming: each node patches its own entry via patchRef
 *   - No node waits for another's rendering — only data deps
 */
import { useCallback, useRef } from 'react';
import { parseIntentDAG, likelyCompound, type IntentDAG, type IntentNode } from '@/services/intent-dag';
import { buildExecutionPlan, type NodeResult, type ExecutionWave } from '@/services/dag-executor';
import { buildSpatialContext } from '@/services/spatial-context';
import { setActivityDetail, recordTutorTurn, filterByComposition, addRelation } from '@/state';
import { parseTutorResponse } from '@/services/tutor-response-parser';
import { TUTOR_AGENT } from '@/services/agents';
import { runTextAgent, runTextAgentStreaming } from '@/services/run-agent';
import { inferTutorMode, extractTopics } from './tutor-helpers';
import { resolveCommandContext } from '@/services/command-context';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { ResponsePlan } from './useResponseOrchestrator';

// ─── Types ──────────────────────────────────────────────────

interface CompoundRefs {
  addEntry: (e: NotebookEntry) => void;
  addEntryWithId: (e: NotebookEntry) => string | Promise<string>;
  patchEntryContent: (id: string, e: NotebookEntry) => void;
  entries: LiveEntry[];
  pinnedEntries: LiveEntry[];
  sessionTopic: string | null;
  studentId: string;
  notebookId: string;
}

export type PlanCallback = (plans: ResponsePlan[]) => void;

// ─── Node context builder ───────────────────────────────────

function buildNodePrompt(
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
): string {
  const parts: string[] = [];

  for (const depId of node.dependsOn) {
    const dep = priorResults.get(depId);
    const depNode = dag.nodes.find((n: IntentNode) => n.id === depId);
    if (dep?.success && depNode) {
      const text = dep.entries
        .filter((e): e is NotebookEntry & { content: string } => 'content' in e)
        .map((e) => e.content)
        .join('\n');
      if (text) parts.push(`[Prior ${depNode.action}: ${text.slice(0, 500)}]`);
    }
  }

  if (node.entities.length > 0) {
    parts.push(`[Entities: ${node.entities.map((e: { name: string; entityType: string }) => `${e.name} (${e.entityType})`).join(', ')}]`);
  }

  const ctx = parts.length > 0 ? parts.join('\n') + '\n\n' : '';
  return `${ctx}${node.content}`;
}

// ─── Per-node isolated execution ────────────────────────────

async function executeNode(
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
  streamingId: string,
  refs: CompoundRefs,
  signal: AbortSignal,
): Promise<NodeResult> {
  if (node.action === 'silence') {
    refs.patchEntryContent(streamingId, { type: 'silence', text: undefined });
    return { nodeId: node.id, entries: [{ type: 'silence' }], success: true };
  }

  const basePrompt = buildNodePrompt(node, dag, priorResults);

  // Enrich with graph context (mastery, gaps, threads, thinkers)
  const analyticalActions = new Set([
    'research', 'teach', 'flashcards', 'exercise', 'quiz', 'podcast',
  ]);
  const tier = analyticalActions.has(node.action) ? 2 : 1;
  const cmdCtx = await resolveCommandContext(
    node.content, refs.entries, tier as 0 | 1 | 2, node.action, refs.notebookId,
  );
  const prompt = cmdCtx.formatted
    ? `${basePrompt}\n\n${cmdCtx.formatted}`
    : basePrompt;

  const messages = [{ role: 'user' as const, parts: [{ text: prompt }] }];

  // Map DAG action to valid TutorActivityStep
  const ACTION_TO_STEP: Record<string, string> = {
    respond: 'streaming', visualize: 'visualizing', explain: 'thinking',
    illustrate: 'illustrating', research: 'researching', define: 'thinking',
    connect: 'thinking', flashcards: 'thinking', exercise: 'thinking',
    quiz: 'thinking', summarize: 'thinking', timeline: 'visualizing',
    teach: 'thinking', podcast: 'thinking', silence: 'reflecting',
  };
  setActivityDetail({
    step: (ACTION_TO_STEP[node.action] ?? 'thinking') as 'thinking',
    label: node.label + '…',
  });

  try {
    let text: string;

    if (node.id === dag.rootId) {
      // Root node streams tokens into its entry
      const result = await runTextAgentStreaming(TUTOR_AGENT, messages, (_chunk, accumulated) => {
        if (signal.aborted) return;
        refs.patchEntryContent(streamingId, {
          type: 'streaming-text', content: accumulated, done: false,
        });
      });
      text = result.text;
    } else {
      // Non-root nodes run without streaming (result patches at end)
      const result = await runTextAgent(TUTOR_AGENT, messages);
      text = result.text;
    }

    if (signal.aborted) {
      return { nodeId: node.id, entries: [], success: false, error: 'aborted' };
    }

    const entry = parseTutorResponse(text);
    const finalEntry = entry ?? { type: 'tutor-marginalia' as const, content: text };

    // Check composition guard
    const filtered = filterByComposition([finalEntry], refs.entries);
    const accepted = filtered[0] ?? finalEntry;

    // Patch the streaming placeholder with the real entry
    refs.patchEntryContent(streamingId, accepted);
    recordTutorTurn(inferTutorMode(accepted), extractTopics(accepted));
    addRelation({ from: streamingId, to: streamingId, type: 'references', meta: `dag:${node.action}` });

    return { nodeId: node.id, entries: [accepted], success: true };
  } catch (err) {
    if (signal.aborted) {
      return { nodeId: node.id, entries: [], success: false, error: 'aborted' };
    }
    const error = err instanceof Error ? err.message : String(err);
    // Patch entry with error state
    refs.patchEntryContent(streamingId, {
      type: 'tutor-marginalia', content: `_Could not complete: ${node.label}_`,
    });
    return { nodeId: node.id, entries: [], success: false, error };
  }
}

// ─── Wave-based concurrent execution ────────────────────────

async function executeWave(
  wave: ExecutionWave,
  dag: IntentDAG,
  results: Map<string, NodeResult>,
  entryIds: Map<string, string>,
  refs: CompoundRefs,
  signal: AbortSignal,
  onProgress: PlanCallback,
  plans: ResponsePlan[],
): Promise<void> {
  const updatePlan = (nodeId: string, status: ResponsePlan['status']) => {
    const updated = plans.map((p) =>
      p.intentId === nodeId ? { ...p, status } : p
    );
    plans.splice(0, plans.length, ...updated);
    onProgress([...plans]);
  };

  if (wave.parallel && wave.nodes.length > 1) {
    // Execute all nodes concurrently — each has its own entry
    await Promise.all(wave.nodes.map(async (node) => {
      if (signal.aborted) return;
      const streamId = entryIds.get(node.id);
      if (!streamId) return;
      updatePlan(node.id, 'active');
      const result = await executeNode(node, dag, results, streamId, refs, signal);
      results.set(node.id, result);
      updatePlan(node.id, result.success ? 'complete' : 'error');
    }));
  } else {
    // Sequential execution
    for (const node of wave.nodes) {
      if (signal.aborted) break;
      const streamId = entryIds.get(node.id);
      if (!streamId) continue;
      updatePlan(node.id, 'active');
      const result = await executeNode(node, dag, results, streamId, refs, signal);
      results.set(node.id, result);
      updatePlan(node.id, result.success ? 'complete' : 'error');
    }
  }
}

// ─── Public hook ────────────────────────────────────────────

export function useCompoundResponse() {
  const activeAbort = useRef<AbortController | null>(null);

  /**
   * Check if input is likely compound (cheap, no LLM call).
   */
  const isLikelyCompound = useCallback((text: string): boolean => {
    return likelyCompound(text);
  }, []);

  /**
   * Execute a compound response pipeline.
   * Creates isolated streaming entries for each DAG node.
   * Returns the DAG for UI rendering (ResponsePlanPreview).
   */
  const executeCompound = useCallback(async (
    studentText: string,
    refs: CompoundRefs,
    onPlan: PlanCallback,
  ): Promise<IntentDAG | null> => {
    // Abort any prior compound execution
    activeAbort.current?.abort();
    const abort = new AbortController();
    activeAbort.current = abort;

    // Build spatial context for implicit reference resolution
    const spatial = buildSpatialContext(
      refs.entries, refs.pinnedEntries, refs.sessionTopic,
    );

    // Parse the DAG via Flash Lite
    setActivityDetail({ step: 'routing', label: 'understanding your intent…' });
    const dag = await parseIntentDAG(studentText, refs.entries, spatial);

    if (abort.signal.aborted) return null;

    // If not compound, bail — caller uses normal single-response path
    if (!dag.isCompound) return null;

    // Build execution plan
    const plan = buildExecutionPlan(dag);

    // Create one streaming-text entry per node (all at once, gives them IDs)
    const entryIds = new Map<string, string>();
    const plans: ResponsePlan[] = [];

    for (const node of dag.nodes) {
      const id = await refs.addEntryWithId({
        type: 'streaming-text', content: '', done: false,
      });
      const resolvedId = typeof id === 'string' ? id : await id;
      entryIds.set(node.id, resolvedId);
      plans.push({
        intentId: node.id,
        label: node.label,
        responseType: node.action,
        status: 'pending',
      });
    }

    onPlan([...plans]);

    // Execute waves
    const results = new Map<string, NodeResult>();
    for (const wave of plan.waves) {
      if (abort.signal.aborted) break;
      await executeWave(wave, dag, results, entryIds, refs, abort.signal, onPlan, plans);
    }

    // Final plan update — mark all complete
    onPlan(plans.map((p) => ({
      ...p,
      status: results.get(p.intentId)?.success ? 'complete' as const : p.status,
    })));

    activeAbort.current = null;
    return dag;
  }, []);

  const abort = useCallback(() => {
    activeAbort.current?.abort();
    activeAbort.current = null;
  }, []);

  return { isLikelyCompound, executeCompound, abort };
}
