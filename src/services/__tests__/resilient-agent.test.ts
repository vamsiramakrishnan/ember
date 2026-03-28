import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(),
  runTextAgentStreaming: vi.fn(),
}));

vi.mock('../gemini', () => ({
  MODELS: {
    text: 'gemini-3.1-flash-lite-preview',
    heavy: 'gemini-3-flash-preview',
    image: 'gemini-3.1-flash-image-preview',
    fallback: 'gemini-2.5-flash-lite',
    gemma: 'gemma-3-1b-it',
  },
}));

import { resilientTextAgent, resilientStreamingAgent, fallbackFor } from '../resilient-agent';
import { runTextAgent, runTextAgentStreaming } from '../run-agent';
import type { AgentConfig } from '../agents';

const agent: AgentConfig = {
  name: 'Test',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: 'test',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

describe('resilient-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fallbackFor', () => {
    it('maps 3-flash to 3.1-flash-lite', () => {
      expect(fallbackFor('gemini-3-flash-preview')).toBe('gemini-3.1-flash-lite-preview');
    });

    it('maps 3.1-flash-lite to 2.5-flash-lite', () => {
      expect(fallbackFor('gemini-3.1-flash-lite-preview')).toBe('gemini-2.5-flash-lite');
    });

    it('returns fallback for unknown model', () => {
      expect(fallbackFor('unknown-model')).toBe('gemini-2.5-flash-lite');
    });
  });

  describe('resilientTextAgent', () => {
    it('returns primary result on success', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: 'primary response', citations: [],
      });

      const result = await resilientTextAgent(agent, []);
      expect(result.text).toBe('primary response');
      expect(runTextAgent).toHaveBeenCalledTimes(1);
    });

    it('falls back to secondary model on primary failure', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('primary down'))
        .mockResolvedValueOnce({ text: 'fallback response', citations: [] });

      const result = await resilientTextAgent(agent, []);
      expect(result.text).toBe('fallback response');
      expect(runTextAgent).toHaveBeenCalledTimes(2);

      const secondCall = (runTextAgent as ReturnType<typeof vi.fn>).mock.calls[1]![0] as AgentConfig;
      expect(secondCall.model).toBe('gemini-2.5-flash-lite');
    });

    it('returns graceful fallback when both tiers fail', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('tier 1'))
        .mockRejectedValueOnce(new Error('tier 2'));

      const result = await resilientTextAgent(agent, []);
      expect(result.text).toContain('reflect');
    });
  });

  describe('resilientStreamingAgent', () => {
    it('returns streaming result on success', async () => {
      (runTextAgentStreaming as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: 'streamed text', citations: [],
      });

      const chunks: string[] = [];
      const result = await resilientStreamingAgent(agent, [], (c) => chunks.push(c));
      expect(result.text).toBe('streamed text');
    });

    it('falls back to non-streaming on streaming failure', async () => {
      (runTextAgentStreaming as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('stream failed'));
      (runTextAgent as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: 'fallback text', citations: [] });

      const chunks: string[] = [];
      const result = await resilientStreamingAgent(agent, [], (c) => chunks.push(c));
      expect(result.text).toBe('fallback text');
      expect(chunks).toContain('fallback text');
    });

    it('returns graceful fallback and calls onChunk when both fail', async () => {
      (runTextAgentStreaming as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('stream fail'));
      (runTextAgent as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('text fail'));

      const chunks: string[] = [];
      const result = await resilientStreamingAgent(agent, [], (c) => chunks.push(c));
      expect(result.text).toContain('reflect');
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
