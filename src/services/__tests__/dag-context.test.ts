/**
 * Tests for dag-context.ts — builds context from prior DAG node results.
 */
import { describe, it, expect } from 'vitest';
import { buildContext } from '../dag-context';
import type { IntentNode, IntentDAG } from '../intent-dag';
import type { NodeResult } from '../dag-executor';

function makeNode(overrides: Partial<IntentNode> = {}): IntentNode {
  return {
    id: 'n0', action: 'respond', content: 'test',
    entities: [], dependsOn: [], parallel: false, label: 'test',
    ...overrides,
  };
}

function makeDAG(nodes: IntentNode[]): IntentDAG {
  return {
    nodes,
    rootId: nodes[0]?.id ?? 'n0',
    isCompound: nodes.length > 1,
    summary: 'test',
  };
}

describe('buildContext', () => {
  it('returns empty string when no dependencies', () => {
    const node = makeNode();
    const dag = makeDAG([node]);
    const result = buildContext(node, dag, new Map());
    expect(result).toBe('');
  });

  it('includes content from dependency results', () => {
    const dep = makeNode({ id: 'n0', action: 'research', content: 'topic' });
    const main = makeNode({ id: 'n1', dependsOn: ['n0'] });
    const dag = makeDAG([dep, main]);
    const results = new Map<string, NodeResult>([
      ['n0', {
        nodeId: 'n0', success: true,
        entries: [{ type: 'tutor-marginalia', content: 'Research findings' }],
      }],
    ]);
    const result = buildContext(main, dag, results);
    expect(result).toContain('Research findings');
    expect(result).toContain('Prior research');
  });

  it('skips failed dependency results', () => {
    const dep = makeNode({ id: 'n0' });
    const main = makeNode({ id: 'n1', dependsOn: ['n0'] });
    const dag = makeDAG([dep, main]);
    const results = new Map<string, NodeResult>([
      ['n0', { nodeId: 'n0', success: false, entries: [], error: 'failed' }],
    ]);
    expect(buildContext(main, dag, results)).toBe('');
  });

  it('includes entity references', () => {
    const node = makeNode({
      entities: [
        { name: 'Kepler', entityType: 'thinker', entityId: 'k1' },
        { name: 'Gravity', entityType: 'concept', entityId: 'g1' },
      ],
    });
    const dag = makeDAG([node]);
    const result = buildContext(node, dag, new Map());
    expect(result).toContain('Kepler (thinker)');
    expect(result).toContain('Gravity (concept)');
  });

  it('truncates long dependency content to 500 chars', () => {
    const dep = makeNode({ id: 'n0', action: 'research' });
    const main = makeNode({ id: 'n1', dependsOn: ['n0'] });
    const dag = makeDAG([dep, main]);
    const longContent = 'x'.repeat(1000);
    const results = new Map<string, NodeResult>([
      ['n0', {
        nodeId: 'n0', success: true,
        entries: [{ type: 'tutor-marginalia', content: longContent }],
      }],
    ]);
    const result = buildContext(main, dag, results);
    // The content inside should be sliced to 500
    expect(result.length).toBeLessThan(1000);
  });

  it('combines dependency context and entity refs', () => {
    const dep = makeNode({ id: 'n0', action: 'respond' });
    const main = makeNode({
      id: 'n1', dependsOn: ['n0'],
      entities: [{ name: 'Newton', entityType: 'thinker', entityId: '' }],
    });
    const dag = makeDAG([dep, main]);
    const results = new Map<string, NodeResult>([
      ['n0', {
        nodeId: 'n0', success: true,
        entries: [{ type: 'tutor-marginalia', content: 'answer' }],
      }],
    ]);
    const result = buildContext(main, dag, results);
    expect(result).toContain('Prior respond');
    expect(result).toContain('Newton (thinker)');
  });
});
