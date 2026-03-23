/**
 * useResponseOrchestrator — React hook that coordinates multi-intent
 * tutor responses using the LLM-parsed IntentDAG.
 *
 * Flow:
 *   1. Student submits text → parseIntentDAG() via Flash Lite
 *   2. DAG validated by Zod → deterministic execution plan
 *   3. executeDAG() walks the graph, dispatching nodes to agents
 *   4. ResponsePlanPreview shows progress in the notebook
 *   5. Entries appear as they complete, in dependency order
 *
 * For simple inputs (single node, isCompound=false), this skips
 * the DAG overhead and routes directly to the existing orchestrator.
 *
 * See: services/intent-dag.ts, services/dag-executor.ts
 */
import { useState, useCallback, useRef } from 'react';
import { parseIntentDAG, type IntentDAG } from '@/services/intent-dag';
import { executeDAG, collectEntries, buildExecutionPlan } from '@/services/dag-executor';
import { dispatchNode } from '@/services/dag-dispatcher';
import type { LiveEntry, NotebookEntry } from '@/types/entries';
import type { StreamChunkCallback } from '@/services/orchestrator';

// ─── Plan state for the ResponsePlanPreview ─────────────────

export interface ResponsePlan {
  intentId: string;
  label: string;
  responseType: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface OrchestratorState {
  active: boolean;
  plans: ResponsePlan[];
  dag: IntentDAG | null;
}

export function useResponseOrchestrator() {
  const [state, setState] = useState<OrchestratorState>({
    active: false, plans: [], dag: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * Attempt to parse compound input. Returns the DAG if compound,
   * null if simple (caller should use normal single-response flow).
   */
  const tryParse = useCallback(async (
    text: string,
    recentEntries: LiveEntry[],
  ): Promise<IntentDAG | null> => {
    const dag = await parseIntentDAG(text, recentEntries);
    if (!dag.isCompound) return null;
    return dag;
  }, []);

  /**
   * Execute a compound DAG, streaming the root node and producing
   * all entries as they complete.
   */
  const execute = useCallback(async (
    dag: IntentDAG,
    onEntries: (entries: NotebookEntry[]) => void,
    onChunk?: StreamChunkCallback,
  ): Promise<void> => {
    // Initialize plan state
    const plans: ResponsePlan[] = dag.nodes.map((node) => ({
      intentId: node.id,
      label: node.label,
      responseType: node.action,
      status: 'pending' as const,
    }));

    setState({ active: true, plans, dag });

    const onProgress = (
      nodeId: string,
      status: 'pending' | 'active' | 'complete' | 'error',
      label: string,
    ) => {
      setState((prev) => ({
        ...prev,
        plans: prev.plans.map((p) =>
          p.intentId === nodeId ? { ...p, status, label } : p
        ),
      }));
    };

    const results = await executeDAG(dag, dispatchNode, onProgress, onChunk);
    const entries = collectEntries(dag, results);
    onEntries(entries);

    setState({ active: false, plans: [], dag: null });
  }, []);

  return {
    /** Whether a compound DAG is currently executing. */
    active: state.active,
    /** Current execution plan for ResponsePlanPreview. */
    plans: state.plans,
    /** The current DAG being executed. */
    dag: state.dag,
    /** Parse input — returns DAG if compound, null if simple. */
    tryParse,
    /** Execute a compound DAG. */
    execute,
  };
}
