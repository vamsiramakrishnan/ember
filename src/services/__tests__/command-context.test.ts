import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../graph-context', () => ({
  buildGraphContext: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../working-memory', () => ({
  getWorkingMemory: vi.fn(() => ({ summary: 'test summary' })),
}));

vi.mock('@/state', () => ({
  getSessionState: vi.fn(() => ({
    activeConcepts: [{ term: 'Harmonics' }],
    masterySnapshot: [{ concept: 'Ratio', level: 'developing', percentage: 40 }],
    phase: 'exploring',
  })),
}));

vi.mock('../spatial-context', () => ({
  buildSpatialContext: vi.fn(() => ({ prompt: 'spatial context' })),
}));

vi.mock('../run-agent', () => ({
  askAgent: vi.fn(() => Promise.resolve('resolved query text')),
}));

vi.mock('../context-formatter', () => ({
  formatContext: vi.fn(() => 'formatted context'),
}));

vi.mock('../agents/config', () => ({
  micro: vi.fn(() => ({
    name: 'micro', model: 'test', systemInstruction: 'test',
    thinkingLevel: 'MINIMAL', tools: [], responseModalities: ['TEXT'],
  })),
  EMBER_DESIGN_CONTEXT: 'design context',
}));

vi.mock('../gemini', () => ({
  MODELS: {
    text: 'gemini-3.1-flash-lite-preview',
    heavy: 'gemini-3-flash-preview',
    fallback: 'gemini-2.5-flash-lite',
  },
}));

import { resolveCommandContext } from '../command-context';

describe('command-context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tier 0: resolves query without enrichment', async () => {
    const result = await resolveCommandContext('explain harmonics', [], 0, 'explain');
    expect(result.tier).toBe(0);
    expect(result.formatted).toBe('');
    expect(result.graphLayer).toBeNull();
    // No @mention, no vague ref -> passes through with mentions stripped
    expect(result.resolvedQuery).toBe('explain harmonics');
  });

  it('tier 0: strips @mentions from query', async () => {
    const result = await resolveCommandContext(
      'explain @[Kepler](thinker:k1)', [], 0, 'explain',
    );
    // Has @mention -> triggers resolution via askAgent
    expect(result.resolvedQuery).toBe('resolved query text');
  });

  it('tier 1: adds formatted context', async () => {
    const result = await resolveCommandContext(
      'explain ratios', [], 1, 'explain', 'notebook-1',
    );
    expect(result.tier).toBe(1);
    expect(result.formatted).toBe('formatted context');
    expect(result.graphLayer).toBeNull();
  });

  it('tier 2: includes graph context when available', async () => {
    const { buildGraphContext } = await import('../graph-context');
    (buildGraphContext as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      activeConcepts: [{ concept: 'Ratio', level: 'active', percentage: 0, connections: 2 }],
      nearbyGaps: [],
      openThreads: [],
      unbridgedThinkers: [],
    });

    const result = await resolveCommandContext(
      'explain ratios', [], 2, 'explain', 'notebook-1',
    );
    expect(result.tier).toBe(2);
    expect(result.graphLayer).not.toBeNull();
  });

  it('tier 2: gracefully handles graph context failure', async () => {
    const { buildGraphContext } = await import('../graph-context');
    (buildGraphContext as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('graph failed'),
    );

    const result = await resolveCommandContext(
      'explain ratios', [], 2, 'explain', 'notebook-1',
    );
    expect(result.tier).toBe(2);
    expect(result.graphLayer).toBeNull();
  });

  it('resolves vague references via LLM', async () => {
    const result = await resolveCommandContext(
      'explain this concept', [], 0, 'explain',
    );
    // "this" triggers LLM resolution
    expect(result.resolvedQuery).toBe('resolved query text');
  });
});
