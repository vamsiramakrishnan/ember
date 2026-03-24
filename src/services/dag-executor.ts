/**
 * DAG Executor — deterministic execution of an IntentDAG.
 *
 * Inspired by Claude Code's tool-use pattern: the LLM produces a
 * structured plan (the DAG), and execution is purely mechanical.
 * No AI in the execution loop. Walk the graph, dispatch to agents,
 * collect results.
 *
 * Execution model:
 * 1. Topological sort the DAG
 * 2. Group nodes by dependency level (wave-based execution)
 * 3. Within a wave, run parallel-flagged nodes concurrently
 * 4. Each node dispatches to the appropriate agent/orchestrator
 * 5. Results flow into the notebook as typed entries
 *
 * The executor is a pure function of the DAG — given the same DAG,
 * it always produces the same execution plan. Only the agent
 * responses introduce non-determinism.
 */
import type { IntentDAG, IntentNode } from './intent-dag';
import type { NotebookEntry } from '@/types/entries';
import type { StreamChunkCallback } from './orchestrator';

// ─── Execution types ────────────────────────────────────────

export interface NodeResult {
  nodeId: string;
  entries: NotebookEntry[];
  /** Whether this node's agent call succeeded. */
  success: boolean;
  error?: string;
}

export interface ExecutionWave {
  /** Nodes that can run in this wave (all deps satisfied). */
  nodes: IntentNode[];
  /** Whether nodes in this wave can run concurrently. */
  parallel: boolean;
}

export interface ExecutionPlan {
  waves: ExecutionWave[];
  totalNodes: number;
}

export type NodeDispatcher = (
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
  onChunk?: StreamChunkCallback,
) => Promise<NodeResult>;

export type ProgressCallback = (
  nodeId: string,
  status: 'pending' | 'active' | 'complete' | 'error',
  label: string,
) => void;

// ─── Topological sort ───────────────────────────────────────

function topoSort(dag: IntentDAG): IntentNode[] {
  const sorted: IntentNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const nodeMap = new Map(dag.nodes.map((n) => [n.id, n]));

  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      console.warn(`[DAG] Cycle detected at node ${id}, breaking`);
      return;
    }
    visiting.add(id);
    const node = nodeMap.get(id);
    if (!node) return;
    for (const dep of node.dependsOn) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    sorted.push(node);
  }

  for (const node of dag.nodes) {
    visit(node.id);
  }
  return sorted;
}

// ─── Wave grouping ──────────────────────────────────────────

/**
 * Group sorted nodes into execution waves.
 * A wave is a set of nodes whose dependencies are all in prior waves.
 */
function buildWaves(sorted: IntentNode[]): ExecutionWave[] {
  const waves: ExecutionWave[] = [];
  const assigned = new Set<string>();

  while (assigned.size < sorted.length) {
    const wave: IntentNode[] = [];
    let parallel = true;

    for (const node of sorted) {
      if (assigned.has(node.id)) continue;
      const depsReady = node.dependsOn.every((d) => assigned.has(d));
      if (depsReady) {
        wave.push(node);
        if (!node.parallel) parallel = false;
      }
    }

    if (wave.length === 0) break; // prevent infinite loop on broken DAGs

    for (const node of wave) {
      assigned.add(node.id);
    }

    waves.push({ nodes: wave, parallel: parallel && wave.length > 1 });
  }

  return waves;
}

// ─── Plan (static analysis, no execution) ───────────────────

/** Build an execution plan from a DAG — pure, no side effects. */
export function buildExecutionPlan(dag: IntentDAG): ExecutionPlan {
  const sorted = topoSort(dag);
  const waves = buildWaves(sorted);
  return { waves, totalNodes: dag.nodes.length };
}

// ─── Execute ────────────────────────────────────────────────

/**
 * Execute a DAG deterministically.
 *
 * @param dag — The validated IntentDAG
 * @param dispatch — Function that handles a single node (calls the right agent)
 * @param onProgress — Optional callback for UI updates
 * @param onChunk — Optional streaming callback for the first/root node
 * @returns All results keyed by node ID
 */
export async function executeDAG(
  dag: IntentDAG,
  dispatch: NodeDispatcher,
  onProgress?: ProgressCallback,
  onChunk?: StreamChunkCallback,
): Promise<Map<string, NodeResult>> {
  const plan = buildExecutionPlan(dag);
  const results = new Map<string, NodeResult>();

  // Mark all nodes as pending
  for (const node of dag.nodes) {
    onProgress?.(node.id, 'pending', node.label);
  }

  for (const wave of plan.waves) {
    if (wave.parallel) {
      // Run all nodes in this wave concurrently
      const promises = wave.nodes.map(async (node) => {
        onProgress?.(node.id, 'active', node.label);
        try {
          // Only stream the root node
          const chunk = node.id === dag.rootId ? onChunk : undefined;
          const result = await dispatch(node, dag, results, chunk);
          results.set(node.id, result);
          onProgress?.(node.id, result.success ? 'complete' : 'error', node.label);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          results.set(node.id, {
            nodeId: node.id, entries: [], success: false, error,
          });
          onProgress?.(node.id, 'error', node.label);
        }
      });
      await Promise.all(promises);
    } else {
      // Run sequentially
      for (const node of wave.nodes) {
        onProgress?.(node.id, 'active', node.label);
        try {
          const chunk = node.id === dag.rootId ? onChunk : undefined;
          const result = await dispatch(node, dag, results, chunk);
          results.set(node.id, result);
          onProgress?.(node.id, result.success ? 'complete' : 'error', node.label);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          results.set(node.id, {
            nodeId: node.id, entries: [], success: false, error,
          });
          onProgress?.(node.id, 'error', node.label);
        }
      }
    }
  }

  return results;
}

/**
 * Collect all notebook entries from execution results, in DAG order.
 */
export function collectEntries(
  dag: IntentDAG,
  results: Map<string, NodeResult>,
): NotebookEntry[] {
  const sorted = topoSort(dag);
  const entries: NotebookEntry[] = [];
  for (const node of sorted) {
    const result = results.get(node.id);
    if (result?.success) {
      entries.push(...result.entries);
    }
  }
  return entries;
}
