/**
 * Tests for dag-executor.ts — deterministic DAG execution.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  buildExecutionPlan,
  executeDAG,
  collectEntries,
  type NodeResult,
  type NodeDispatcher,
} from '../dag-executor';
import type { IntentDAG, IntentNode } from '../intent-dag';

function makeNode(overrides: Partial<IntentNode> = {}): IntentNode {
  return {
    id: 'n0', action: 'respond', content: 'test',
    entities: [], dependsOn: [], parallel: false, label: 'test',
    ...overrides,
  };
}

function makeDAG(nodes: IntentNode[], rootId?: string): IntentDAG {
  return {
    nodes,
    rootId: rootId ?? nodes[0]?.id ?? 'n0',
    isCompound: nodes.length > 1,
    summary: 'test dag',
  };
}

describe('buildExecutionPlan', () => {
  it('creates single wave for single node', () => {
    const dag = makeDAG([makeNode()]);
    const plan = buildExecutionPlan(dag);
    expect(plan.waves).toHaveLength(1);
    expect(plan.totalNodes).toBe(1);
    expect(plan.waves[0].nodes).toHaveLength(1);
  });

  it('creates two waves for linear dependency', () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'] }),
    ]);
    const plan = buildExecutionPlan(dag);
    expect(plan.waves).toHaveLength(2);
    expect(plan.waves[0].nodes[0].id).toBe('n0');
    expect(plan.waves[1].nodes[0].id).toBe('n1');
  });

  it('groups parallel nodes in the same wave', () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'], parallel: true }),
      makeNode({ id: 'n2', dependsOn: ['n0'], parallel: true }),
    ]);
    const plan = buildExecutionPlan(dag);
    expect(plan.waves).toHaveLength(2);
    expect(plan.waves[1].nodes).toHaveLength(2);
    expect(plan.waves[1].parallel).toBe(true);
  });

  it('marks wave as non-parallel if any node is not parallel', () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'], parallel: true }),
      makeNode({ id: 'n2', dependsOn: ['n0'], parallel: false }),
    ]);
    const plan = buildExecutionPlan(dag);
    expect(plan.waves[1].parallel).toBe(false);
  });

  it('handles diamond dependencies', () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'], parallel: true }),
      makeNode({ id: 'n2', dependsOn: ['n0'], parallel: true }),
      makeNode({ id: 'n3', dependsOn: ['n1', 'n2'] }),
    ]);
    const plan = buildExecutionPlan(dag);
    expect(plan.waves).toHaveLength(3);
    expect(plan.waves[2].nodes[0].id).toBe('n3');
  });
});

describe('executeDAG', () => {
  it('executes single node', async () => {
    const dag = makeDAG([makeNode()]);
    const dispatch: NodeDispatcher = vi.fn(async (node) => ({
      nodeId: node.id,
      entries: [{ type: 'tutor-marginalia', content: 'response' }],
      success: true,
    }));

    const results = await executeDAG(dag, dispatch);
    expect(results.size).toBe(1);
    expect(results.get('n0')?.success).toBe(true);
  });

  it('passes prior results to dependent nodes', async () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'] }),
    ]);

    const dispatch: NodeDispatcher = vi.fn(async (node, _dag, priorResults) => {
      if (node.id === 'n1') {
        const prior = priorResults.get('n0');
        expect(prior?.success).toBe(true);
      }
      return { nodeId: node.id, entries: [], success: true };
    });

    await executeDAG(dag, dispatch);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('calls progress callback', async () => {
    const dag = makeDAG([makeNode()]);
    const dispatch: NodeDispatcher = async (node) => ({
      nodeId: node.id, entries: [], success: true,
    });
    const progress = vi.fn();

    await executeDAG(dag, dispatch, progress);
    expect(progress).toHaveBeenCalledWith('n0', 'pending', 'test');
    expect(progress).toHaveBeenCalledWith('n0', 'active', 'test');
    expect(progress).toHaveBeenCalledWith('n0', 'complete', 'test');
  });

  it('reports error status on dispatch failure', async () => {
    const dag = makeDAG([makeNode()]);
    const dispatch: NodeDispatcher = async () => {
      throw new Error('agent failed');
    };
    const progress = vi.fn();

    const results = await executeDAG(dag, dispatch, progress);
    expect(results.get('n0')?.success).toBe(false);
    expect(results.get('n0')?.error).toBe('agent failed');
    expect(progress).toHaveBeenCalledWith('n0', 'error', 'test');
  });

  it('streams only the root node', async () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'] }),
    ], 'n0');

    const onChunk = vi.fn();
    const dispatch: NodeDispatcher = vi.fn(async (node, _d, _p, chunk) => {
      if (node.id === 'n0') expect(chunk).toBe(onChunk);
      if (node.id === 'n1') expect(chunk).toBeUndefined();
      return { nodeId: node.id, entries: [], success: true };
    });

    await executeDAG(dag, dispatch, undefined, onChunk);
  });

  it('executes parallel waves concurrently', async () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'], parallel: true }),
      makeNode({ id: 'n2', dependsOn: ['n0'], parallel: true }),
    ]);

    const order: string[] = [];
    const dispatch: NodeDispatcher = async (node) => {
      order.push(`start-${node.id}`);
      await new Promise((r) => setTimeout(r, 10));
      order.push(`end-${node.id}`);
      return { nodeId: node.id, entries: [], success: true };
    };

    await executeDAG(dag, dispatch);
    // Both n1 and n2 should start before either ends
    const n1Start = order.indexOf('start-n1');
    const n2Start = order.indexOf('start-n2');
    const n1End = order.indexOf('end-n1');
    const n2End = order.indexOf('end-n2');
    expect(n1Start).toBeLessThan(n1End);
    expect(n2Start).toBeLessThan(n2End);
    // Both should start before either finishes (parallel)
    expect(Math.max(n1Start, n2Start)).toBeLessThan(Math.min(n1End, n2End));
  });
});

describe('collectEntries', () => {
  it('collects entries in topological order', () => {
    const dag = makeDAG([
      makeNode({ id: 'n0' }),
      makeNode({ id: 'n1', dependsOn: ['n0'] }),
    ]);
    const results = new Map<string, NodeResult>([
      ['n0', { nodeId: 'n0', entries: [{ type: 'tutor-marginalia', content: 'first' }], success: true }],
      ['n1', { nodeId: 'n1', entries: [{ type: 'tutor-question', content: 'second' }], success: true }],
    ]);

    const entries = collectEntries(dag, results);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ type: 'tutor-marginalia', content: 'first' });
    expect(entries[1]).toEqual({ type: 'tutor-question', content: 'second' });
  });

  it('skips failed nodes', () => {
    const dag = makeDAG([makeNode()]);
    const results = new Map<string, NodeResult>([
      ['n0', { nodeId: 'n0', entries: [], success: false, error: 'fail' }],
    ]);
    expect(collectEntries(dag, results)).toEqual([]);
  });

  it('handles empty results', () => {
    const dag = makeDAG([makeNode()]);
    expect(collectEntries(dag, new Map())).toEqual([]);
  });
});
