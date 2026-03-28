import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  getGeminiClient: vi.fn(() => null),
  isGeminiAvailable: vi.fn(() => false),
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
  proxyTextGeneration: vi.fn(() => Promise.resolve('proxy response')),
  proxyTextGenerationStream: vi.fn(
    (_body: unknown, onChunk: (c: string, a: string) => void) => {
      onChunk('streamed', 'streamed');
      return Promise.resolve('streamed');
    },
  ),
}));

vi.mock('zod', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zod')>();
  return { ...actual, toJSONSchema: vi.fn(() => ({ type: 'object' })) };
});

import { runTextAgent, runTextAgentStreaming, askAgent } from '../run-agent';
import type { AgentConfig } from '../agents';

const testAgent: AgentConfig = {
  name: 'Test',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: 'You are a test agent.',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

describe('run-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runTextAgent', () => {
    it('uses proxy when no client available', async () => {
      const { proxyTextGeneration } = await import('../proxy-client');
      const result = await runTextAgent(testAgent, [
        { role: 'user', parts: [{ text: 'hello' }] },
      ]);
      expect(proxyTextGeneration).toHaveBeenCalled();
      expect(result.text).toBe('proxy response');
      expect(result.citations).toEqual([]);
    });

    it('includes response schema in proxy body when agent has schema', async () => {
      const { proxyTextGeneration } = await import('../proxy-client');
      const { z } = await import('zod');
      const agentWithSchema = { ...testAgent, responseSchema: z.object({}) };
      await runTextAgent(agentWithSchema, [
        { role: 'user', parts: [{ text: 'hello' }] },
      ]);
      const callArg = (proxyTextGeneration as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(callArg.responseMimeType).toBe('application/json');
    });

    it('throws when no client and no proxy', async () => {
      const { useProxy } = await import('../proxy-client');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await expect(
        runTextAgent(testAgent, [{ role: 'user', parts: [{ text: 'hello' }] }]),
      ).rejects.toThrow('Gemini API key not configured');
    });
  });

  describe('runTextAgentStreaming', () => {
    it('uses proxy streaming when no client', async () => {
      const { useProxy } = await import('../proxy-client');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const chunks: string[] = [];
      const result = await runTextAgentStreaming(
        testAgent,
        [{ role: 'user', parts: [{ text: 'hello' }] }],
        (chunk) => chunks.push(chunk),
      );
      expect(result.text).toBe('streamed');
      expect(result.citations).toEqual([]);
    });
  });

  describe('askAgent', () => {
    it('wraps prompt in a user message and returns text', async () => {
      const { useProxy } = await import('../proxy-client');
      (useProxy as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const text = await askAgent(testAgent, 'What is Euler?');
      expect(text).toBe('proxy response');
    });
  });
});
