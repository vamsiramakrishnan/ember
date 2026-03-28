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

    it('handles text response from Gemini client', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockClient = {
        models: {
          generateContent: vi.fn(() =>
            Promise.resolve({
              candidates: [{ content: { parts: [{ text: 'direct response' }] } }],
            }),
          ),
          generateContentStream: vi.fn(),
        },
      };
      (getGeminiClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const result = await runAgenticLoop(
        agent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        context,
      );
      expect(result.text).toBe('direct response');
    });

    it('handles function call responses and executes tools', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      const { executeTool } = await import('../tool-executor');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const mockClient = {
        models: {
          generateContent: vi.fn()
            .mockResolvedValueOnce({
              candidates: [{
                content: {
                  parts: [{
                    functionCall: { name: 'search_history', args: { query: 'test' } },
                  }],
                },
              }],
            })
            .mockResolvedValueOnce({
              candidates: [{
                content: { parts: [{ text: 'final answer' }] },
              }],
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
    });

    it('respects abort signal', async () => {
      const { useProxy } = await import('../proxy-client');
      const { getGeminiClient } = await import('../gemini');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const controller = new AbortController();
      controller.abort();

      const mockClient = {
        models: {
          generateContent: vi.fn(() =>
            Promise.resolve({
              candidates: [{ content: { parts: [{ text: 'response' }] } }],
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
      expect(result.text).toBe('');
    });
  });
});
