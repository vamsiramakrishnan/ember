/**
 * Tests for notebook-bootstrap-dag — DAG building and execution for bootstrap.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../intent-dag', () => ({}));

vi.mock('../dag-executor', () => ({
  executeDAG: vi.fn(async () => new Map()),
  collectEntries: vi.fn(() => []),
}));

vi.mock('../dag-dispatcher', () => ({
  dispatchNode: vi.fn(),
}));

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
}));

vi.mock('../notebook-bootstrap', () => ({
  bootstrapNotebook: vi.fn(async () => ({ opening: null, seeded: false })),
}));

vi.mock('../notebook-enrichment', () => ({
  generateNotebookIcon: vi.fn(async () => null),
}));

vi.mock('@/persistence', () => ({
  Store: { Entries: 'entries' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/entries', () => ({
  createEntry: vi.fn(async () => ({ id: 'e1' })),
}));

vi.mock('@/state/bootstrap-progress', () => ({
  startBootstrapProgress: vi.fn(),
  updateBootstrapNode: vi.fn(),
  finishBootstrapProgress: vi.fn(),
}));

import { buildBootstrapDAG, executeBootstrapDAG } from '../notebook-bootstrap-dag';

describe('buildBootstrapDAG', () => {
  test('builds DAG with expected nodes', () => {
    const dag = buildBootstrapDAG('Mathematics', 'Why calculus?');
    expect(dag.nodes.length).toBeGreaterThan(0);
    expect(dag.rootId).toBe('opening');
    expect(dag.isCompound).toBe(true);
    expect(dag.summary).toContain('Mathematics');
  });

  test('includes research, opening, connect, landscape, teach nodes', () => {
    const dag = buildBootstrapDAG('Physics', 'What is gravity?');
    const ids = dag.nodes.map((n) => n.id);
    expect(ids).toContain('research');
    expect(ids).toContain('opening');
    expect(ids).toContain('connect');
    expect(ids).toContain('landscape');
    expect(ids).toContain('teach');
  });

  test('wave 2 nodes depend on research', () => {
    const dag = buildBootstrapDAG('Math', 'q');
    const connect = dag.nodes.find((n) => n.id === 'connect');
    const landscape = dag.nodes.find((n) => n.id === 'landscape');
    expect(connect?.dependsOn).toContain('research');
    expect(landscape?.dependsOn).toContain('research');
  });

  test('handles empty question', () => {
    const dag = buildBootstrapDAG('Art History', '');
    expect(dag.nodes.length).toBeGreaterThan(0);
  });
});

describe('executeBootstrapDAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns empty array when AI not available', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(false);

    const dag = buildBootstrapDAG('Math', 'q');
    const result = await executeBootstrapDAG(dag, 'nb1');
    expect(result).toEqual([]);
  });

  test('executes DAG and returns entries', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const executor = await import('../dag-executor');
    vi.mocked(executor.collectEntries).mockReturnValue([
      { type: 'tutor-marginalia', content: 'welcome' },
    ]);

    const dag = buildBootstrapDAG('Math', 'q');
    const result = await executeBootstrapDAG(dag, 'nb1');
    expect(result).toHaveLength(1);
  });

  test('calls onEntries callback', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const executor = await import('../dag-executor');
    vi.mocked(executor.collectEntries).mockReturnValue([
      { type: 'tutor-marginalia', content: 'entry' },
    ]);

    const onEntries = vi.fn();
    const dag = buildBootstrapDAG('Math', 'q');
    await executeBootstrapDAG(dag, 'nb1', onEntries);
    expect(onEntries).toHaveBeenCalled();
  });
});
