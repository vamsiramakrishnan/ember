/**
 * Tests for orchestrator.ts — the full tutor pipeline.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('../agents', () => ({
  TUTOR_AGENT: { model: 'test-model', systemInstruction: '' },
}));
vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(async () => ({
    text: '{"type":"tutor-marginalia","content":"response"}', citations: [],
  })),
  resilientStreamingAgent: vi.fn(async () => ({
    text: '{"type":"tutor-marginalia","content":"streamed"}', citations: [],
  })),
}));
vi.mock('../agentic-loop', () => ({
  runAgenticLoop: vi.fn(async () => ({
    text: '{"type":"tutor-marginalia","content":"agentic"}', toolCalls: [], deferredActions: [],
  })),
  runAgenticLoopStreaming: vi.fn(async () => ({
    text: '{"type":"tutor-marginalia","content":"agentic-stream"}', toolCalls: [], deferredActions: [],
  })),
}));
vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  isGeminiAvailable: vi.fn(() => true),
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
vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));
vi.mock('../status-narrator', () => ({
  narrateStep: vi.fn(),
  cancelNarration: vi.fn(),
}));
vi.mock('@/observability', () => ({
  log: { breadcrumb: vi.fn(), error: vi.fn() },
  traceAgentDispatch: vi.fn(async (_n: string, _m: string, fn: () => Promise<unknown>) => fn()),
}));
vi.mock('../orchestrator-pipeline', () => ({
  runPipelineSetup: vi.fn(async () => ({
    routing: { research: false, visualize: false, illustrate: false, directive: false },
    graphSnapshot: null,
    collectedCitations: [],
    echoPromise: Promise.resolve(null),
    contextMessages: [{ role: 'user', parts: [{ text: 'test' }] }],
  })),
  runPipelineEnrichment: vi.fn(async () => []),
  runPipelineTemporalLayers: vi.fn(async () => ({ before: [], after: [] })),
}));
vi.mock('../file-search/session-indexer', () => ({
  indexCurrentSession: vi.fn(),
}));

import { orchestrate, streamOrchestrate } from '../orchestrator';
import { isGeminiAvailable } from '../gemini';

describe('orchestrate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty result when Gemini not available', async () => {
    vi.mocked(isGeminiAvailable).mockReturnValueOnce(false);
    const result = await orchestrate('Hello', [], 's1', 'nb1');
    expect(result.entries).toEqual([]);
    expect(result.deferredActions).toEqual([]);
  });

  it('returns tutor entries on success', async () => {
    const result = await orchestrate('Hello', [], 's1', 'nb1');
    expect(result.entries.length).toBeGreaterThan(0);
  });

  it('returns empty entries when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await orchestrate('Hello', [], 's1', 'nb1', null, null, undefined, controller.signal);
    // After setup, signal is checked
    expect(result.entries).toEqual([]);
  });
});

describe('streamOrchestrate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty when Gemini not available', async () => {
    vi.mocked(isGeminiAvailable).mockReturnValueOnce(false);
    const result = await streamOrchestrate('Hello', [], 's1', 'nb1', vi.fn());
    expect(result.entries).toEqual([]);
  });

  it('returns tutor entries on success', async () => {
    const onChunk = vi.fn();
    const result = await streamOrchestrate('Hello', [], 's1', 'nb1', onChunk);
    expect(result.entries.length).toBeGreaterThan(0);
  });

  it('handles abort signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await streamOrchestrate(
      'Hello', [], 's1', 'nb1', vi.fn(), null, null, undefined, controller.signal,
    );
    expect(result.entries).toEqual([]);
  });
});
