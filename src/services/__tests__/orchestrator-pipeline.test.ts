/**
 * Tests for orchestrator-pipeline.ts — shared pipeline stages.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock all heavy external deps
vi.mock('../agents', () => ({
  RESEARCHER_AGENT: { model: 'test', systemInstruction: '' },
}));
vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(async () => ({
    text: 'Research result', citations: [{ title: 'Src', url: 'http://x' }],
  })),
}));
vi.mock('../graph-context', () => ({
  buildGraphContext: vi.fn(async () => null),
}));
vi.mock('../knowledge-graph', () => ({
  buildGraph: vi.fn(async () => null),
  getDelta: vi.fn(() => ({ nodes: [], edges: [] })),
  serializeSubgraph: vi.fn(() => ''),
}));
vi.mock('../context-assembler', () => ({
  assembleContext: vi.fn(() => ({
    systemPreamble: 'preamble',
    messages: [{ role: 'user', parts: [{ text: 'test' }] }],
  })),
}));
vi.mock('../enrichment', () => ({
  generateVisualization: vi.fn(async () => null),
  generateIllustration: vi.fn(async () => null),
}));
vi.mock('../temporal-layers', () => ({
  generateEcho: vi.fn(async () => null),
  generateBridge: vi.fn(async () => null),
  generateReflection: vi.fn(async () => null),
  incrementReflectionCounter: vi.fn(),
}));
vi.mock('../router-agent', () => ({
  classifyImmediate: vi.fn(async () => ({
    research: false, visualize: false, illustrate: false, directive: false,
  })),
}));
vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));
vi.mock('../status-narrator', () => ({
  narrateStep: vi.fn(),
}));
vi.mock('../semantic-memory', () => ({
  buildSemanticMemory: vi.fn(async () => null),
}));
vi.mock('../diversity-hints', () => ({
  appendDiversityHints: vi.fn(),
}));
vi.mock('../working-memory', () => ({
  getWorkingMemory: vi.fn(() => null),
}));

import {
  fetchResearch,
  runPipelineSetup,
  runPipelineEnrichment,
  runPipelineTemporalLayers,
} from '../orchestrator-pipeline';

describe('fetchResearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns research context and citations', async () => {
    const result = await fetchResearch('What is gravity?');
    expect(result.context).toEqual({ facts: 'Research result' });
    expect(result.citations).toHaveLength(1);
  });

  it('returns null context for empty result', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockResolvedValueOnce({ text: '  ', citations: [] });
    const result = await fetchResearch('test');
    expect(result.context).toBeNull();
  });

  it('handles errors gracefully', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockRejectedValueOnce(new Error('fail'));
    const result = await fetchResearch('test');
    expect(result.context).toBeNull();
    expect(result.citations).toEqual([]);
  });
});

describe('runPipelineSetup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns pipeline setup result', async () => {
    const result = await runPipelineSetup(
      'Hello', [], 'student-1', 'nb-1', undefined, null, null,
    );
    expect(result.routing).toBeDefined();
    expect(result.contextMessages).toBeDefined();
    expect(result.collectedCitations).toEqual([]);
  });
});

describe('runPipelineEnrichment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no enrichment needed', async () => {
    const result = await runPipelineEnrichment(
      { research: false, visualize: false, illustrate: false, directive: false, tutor: true, deepMemory: false, graphExplore: false, reason: '', source: 'fallback' } as import('../router-agent').RoutingDecision,
      'test', [], [],
    );
    expect(result).toEqual([]);
  });

  it('generates visualization when requested', async () => {
    const { generateVisualization } = await import('../enrichment');
    vi.mocked(generateVisualization).mockResolvedValueOnce({
      type: 'visualization', html: '<div>test</div>',
    });
    const result = await runPipelineEnrichment(
      { research: false, visualize: true, illustrate: false, directive: false, tutor: true, deepMemory: false, graphExplore: false, reason: '', source: 'fallback' } as import('../router-agent').RoutingDecision,
      'test', [], [],
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('visualization');
  });
});

describe('runPipelineTemporalLayers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty before/after when no temporal data', async () => {
    const result = await runPipelineTemporalLayers(
      'test', [], 'nb-1', Promise.resolve(null),
    );
    expect(result.before).toEqual([]);
    expect(result.after).toEqual([]);
  });

  it('includes echo in before', async () => {
    const echoEntry = { type: 'echo' as const, content: 'Echo text' };
    const result = await runPipelineTemporalLayers(
      'test', [], 'nb-1', Promise.resolve(echoEntry),
    );
    expect(result.before).toHaveLength(1);
    expect(result.before[0]!.type).toBe('echo');
  });

  it('includes bridge and reflection in after', async () => {
    const { generateBridge, generateReflection } = await import('../temporal-layers');
    vi.mocked(generateBridge).mockResolvedValueOnce({
      type: 'bridge-suggestion', content: 'Bridge',
    });
    vi.mocked(generateReflection).mockResolvedValueOnce({
      type: 'tutor-reflection', content: 'Reflection',
    });
    const result = await runPipelineTemporalLayers(
      'test', [], 'nb-1', Promise.resolve(null),
    );
    expect(result.after).toHaveLength(2);
  });
});
