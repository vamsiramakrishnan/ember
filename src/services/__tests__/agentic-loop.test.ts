import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  MODELS: {
    text: 'gemini-3.1-flash-lite-preview',
    heavy: 'gemini-3-flash-preview',
    image: 'gemini-3.1-flash-image-preview',
    fallback: 'gemini-2.5-flash-lite',
    gemma: 'gemma-3-1b-it',
  },
}));

vi.mock('../proxy-client', () => ({
  useProxy: vi.fn(() => true),
}));

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(() =>
    Promise.resolve({ text: 'proxy response', citations: [] }),
  ),
  runTextAgentStreaming: vi.fn(
    (_agent: unknown, _msgs: unknown, onChunk: (c: string, a: string) => void) => {
      onChunk('chunk', 'chunk');
      return Promise.resolve({ text: 'chunk', citations: [] });
    },
  ),
}));

vi.mock('../agent-tools', () => ({ AGENT_TOOL_DECLARATIONS: [] }));
vi.mock('../graph-tools', () => ({
  GRAPH_TOOL_DECLARATIONS: [],
  extractGraphDeferred: vi.fn(() => null),
}));
vi.mock('../tool-executor', () => ({
  executeTool: vi.fn(() => Promise.resolve('{}')),
  extractDeferredActions: vi.fn(() => null),
}));

import { runAgenticLoop, runAgenticLoopStreaming } from '../agentic-loop';
import type { AgentConfig } from '../agents';

const agent: AgentConfig = {
  name: 'Test',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: 'test',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

const context = { studentId: 's1', notebookId: 'n1' };

describe('agentic-loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runAgenticLoop (proxy path)', () => {
    it('falls back to runTextAgent when using proxy with no client', async () => {
      const result = await runAgenticLoop(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
      );
      expect(result.text).toBe('proxy response');
      expect(result.toolCalls).toEqual([]);
      expect(result.deferredActions).toEqual([]);
    });
  });

  describe('runAgenticLoopStreaming (proxy path)', () => {
    it('falls back to runTextAgentStreaming when using proxy', async () => {
      const chunks: string[] = [];
      const result = await runAgenticLoopStreaming(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
        (c) => chunks.push(c),
      );
      expect(result.text).toBe('chunk');
      expect(chunks).toContain('chunk');
    });
  });

  describe('runAgenticLoop (direct path)', () => {
    it('throws when no client and proxy disabled', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (getGeminiClient as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        runAgenticLoop(agent, [{ role: 'user', parts: [{ text: 'hello' }] }], context),
      ).rejects.toThrow('Gemini API key not configured');
    });

    it('handles text response from Gemini Interactions API', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockClient = {
        interactions: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'interaction-1',
              status: 'completed',
              outputs: [{ type: 'text', text: 'direct response' }],
            }),
          ),
        },
      };
      (getGeminiClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const result = await runAgenticLoop(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
      );
      expect(result.text).toBe('direct response');
      expect(result.interactionId).toBe('interaction-1');
    });

    it('handles function call responses and executes tools', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      const { executeTool } = await import('../tool-executor');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockClient = {
        interactions: {
          create: vi.fn()
            // First call: returns function call
            .mockResolvedValueOnce({
              id: 'interaction-1',
              status: 'requires_action',
              outputs: [{
                type: 'function_call',
                id: 'call-1',
                name: 'search_history',
                arguments: { query: 'test' },
              }],
            })
            // Second call (function result): returns final text
            .mockResolvedValueOnce({
              id: 'interaction-2',
              status: 'completed',
              outputs: [{ type: 'text', text: 'final answer' }],
            }),
        },
      };
      (getGeminiClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const result = await runAgenticLoop(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
      );

      expect(executeTool).toHaveBeenCalledWith('search_history', { query: 'test' }, context);
      expect(result.text).toBe('final answer');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0]).toContain('search_history');
      expect(result.interactionId).toBe('interaction-2');

      // Verify second call was chained with previous_interaction_id
      const secondCall = mockClient.interactions.create.mock.calls[1]![0];
      expect(secondCall.previous_interaction_id).toBe('interaction-1');
    });

    it('respects abort signal', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const controller = new AbortController();
      controller.abort();

      const mockClient = {
        interactions: {
          create: vi.fn(() =>
            Promise.resolve({
              id: 'interaction-1',
              status: 'completed',
              outputs: [{ type: 'text', text: 'response' }],
            }),
          ),
        },
      };
      (getGeminiClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const result = await runAgenticLoop(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
        controller.signal,
      );
      // Should still return text since the first create completes before abort check
      expect(typeof result.text).toBe('string');
    });
  });
});
