/**
 * Tests for dag-dispatcher.ts — routes IntentNodes to agents/generators.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IntentNode, IntentDAG } from '../intent-dag';
import type { NodeResult } from '../dag-executor';

// Mock all external deps
vi.mock('../agents', () => ({
  TUTOR_AGENT: { model: 'test-model', systemInstruction: '' },
}));
vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(async () => ({ text: '{"type":"tutor-marginalia","content":"ok"}', citations: [] })),
  runTextAgentStreaming: vi.fn(async () => ({ text: '{"type":"tutor-marginalia","content":"streamed"}', citations: [] })),
}));
vi.mock('../tutor-response-parser', () => ({
  parseTutorResponse: vi.fn((raw: string) => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { type: 'tutor-marginalia', content: raw };
    }
  }),
}));
vi.mock('../enrichment', () => ({
  generateIllustration: vi.fn(async () => ({ type: 'illustration', dataUrl: 'data:test', caption: 'test' })),
}));
vi.mock('../reading-material-gen', () => ({
  generateReadingMaterial: vi.fn(async () => ({ type: 'reading-material', title: 'T', slides: [] })),
}));
vi.mock('../flashcard-gen', () => ({
  generateFlashcards: vi.fn(async () => ({ type: 'flashcard-deck', title: 'F', cards: [] })),
}));
vi.mock('../exercise-gen', () => ({
  generateExercises: vi.fn(async () => ({ type: 'exercise-set', title: 'E', exercises: [], difficulty: 'foundational' })),
}));
vi.mock('../command-context', () => ({
  resolveCommandContext: vi.fn(async () => ({ formatted: '', citations: [] })),
}));
vi.mock('../dag-context', () => ({
  buildContext: vi.fn(() => ''),
}));
vi.mock('../dag-prompts', () => ({
  buildPrompt: vi.fn((_n: unknown, _c: unknown) => 'prompt'),
}));
vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));
vi.mock('@/observability', () => ({
  log: { breadcrumb: vi.fn() },
  traceAgentDispatch: vi.fn(async (_name: string, _model: string, fn: () => Promise<unknown>) => fn()),
}));

import { dispatchNode, createDispatcher } from '../dag-dispatcher';

function makeNode(overrides: Partial<IntentNode> = {}): IntentNode {
  return {
    id: 'n0', action: 'respond', content: 'test',
    entities: [], dependsOn: [], parallel: false, label: 'test',
    ...overrides,
  };
}

const emptyDAG: IntentDAG = {
  nodes: [], rootId: 'n0', isCompound: false, summary: 'test',
};

describe('dispatchNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns silence entry for silence action', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'silence' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries[0].type).toBe('silence');
  });

  it('dispatches respond to tutor agent', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'respond' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries.length).toBeGreaterThan(0);
  });

  it('dispatches illustrate to image agent', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'illustrate' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries[0].type).toBe('illustration');
  });

  it('dispatches teach to reading material generator', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'teach' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries[0].type).toBe('reading-material');
  });

  it('dispatches flashcards to flashcard generator', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'flashcards' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries[0].type).toBe('flashcard-deck');
  });

  it('dispatches exercise to exercise generator', async () => {
    const result = await dispatchNode(
      makeNode({ action: 'exercise' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(true);
    expect(result.entries[0].type).toBe('exercise-set');
  });

  it('handles illustration failure gracefully', async () => {
    const { generateIllustration } = await import('../enrichment');
    vi.mocked(generateIllustration).mockResolvedValueOnce(null);
    const result = await dispatchNode(
      makeNode({ action: 'illustrate' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('No illustration');
  });

  it('handles rich generator returning null', async () => {
    const { generateFlashcards } = await import('../flashcard-gen');
    vi.mocked(generateFlashcards).mockResolvedValueOnce(null);
    const result = await dispatchNode(
      makeNode({ action: 'flashcards' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(false);
  });

  it('handles tutor agent exception', async () => {
    const { runTextAgent } = await import('../run-agent');
    vi.mocked(runTextAgent).mockRejectedValueOnce(new Error('API down'));
    const result = await dispatchNode(
      makeNode({ action: 'respond' }),
      emptyDAG, new Map(),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('API down');
  });
});

describe('createDispatcher', () => {
  it('returns a dispatcher function', () => {
    const dispatch = createDispatcher('notebook-1');
    expect(typeof dispatch).toBe('function');
  });
});
