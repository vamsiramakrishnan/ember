import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockIsGeminiAvailable = vi.fn(() => true);
const mockRunTextAgent = vi.fn();
const mockIsOnCooldown = vi.fn((_key?: string) => false);
const mockMarkUsed = vi.fn((_key?: string) => {});

vi.mock('../gemini', () => ({
  isGeminiAvailable: () => mockIsGeminiAvailable(),
  getGeminiClient: vi.fn(() => null) as unknown,
  MODELS: {
    text: 'gemini-3.1-flash-lite-preview',
    heavy: 'gemini-3-flash-preview',
    image: 'gemini-3.1-flash-image-preview',
    fallback: 'gemini-2.5-flash-lite',
    gemma: 'gemma-3-1b-it',
  },
}));

vi.mock('../run-agent', () => ({
  runTextAgent: (...args: unknown[]) => mockRunTextAgent(...args) as unknown,
}));

vi.mock('../router-config', () => ({
  ROUTER_AGENT: {
    name: 'Router', model: 'gemini-3.1-flash-lite-preview',
    systemInstruction: 'test', thinkingLevel: 'MINIMAL',
    tools: [], responseModalities: ['TEXT'],
  },
  isOnCooldown: (...args: unknown[]) => mockIsOnCooldown(args[0] as string),
  markUsed: (...args: unknown[]) => mockMarkUsed(args[0] as string),
}));

import { classifyImmediate } from '../router-agent';
import type { LiveEntry } from '@/types/entries';

describe('router-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsGeminiAvailable.mockReturnValue(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns default decision when Gemini is unavailable', async () => {
    mockIsGeminiAvailable.mockReturnValue(false);

    const result = await classifyImmediate('hello', []);
    expect(result.source).toBe('fallback');
    expect(result.tutor).toBe(true);
  });

  it('parses router response and returns structured decision', async () => {
    mockRunTextAgent.mockResolvedValueOnce({
      text: JSON.stringify({
        tutor: true,
        research: true,
        visualize: false,
        illustrate: false,
        deepMemory: false,
        directive: false,
        graphExplore: false,
        reason: 'Student asked factual question',
      }),
      citations: [],
    });

    const result = await classifyImmediate('When was Kepler born?', []);
    expect(result.source).toBe('router');
    expect(result.tutor).toBe(true);
    expect(result.research).toBe(true);
    expect(result.reason).toBe('Student asked factual question');
  });

  it('returns default on parse error', async () => {
    mockRunTextAgent.mockResolvedValueOnce({
      text: 'not json', citations: [],
    });

    const result = await classifyImmediate('hello', []);
    expect(result.source).toBe('fallback');
  });

  it('returns default on API error', async () => {
    mockRunTextAgent.mockRejectedValueOnce(new Error('API error'));

    const result = await classifyImmediate('hello', []);
    expect(result.source).toBe('fallback');
  });

  it('marks used agents for cooldown tracking', async () => {
    mockRunTextAgent.mockResolvedValueOnce({
      text: JSON.stringify({
        research: true, visualize: true, illustrate: false,
        deepMemory: false, directive: false, reason: 'test',
      }),
      citations: [],
    });

    await classifyImmediate('Explain Kepler laws', []);
    expect(mockMarkUsed).toHaveBeenCalledWith('research');
    expect(mockMarkUsed).toHaveBeenCalledWith('visualize');
  });

  it('handles recent entries context', async () => {
    mockRunTextAgent.mockResolvedValueOnce({
      text: JSON.stringify({
        research: false, visualize: false, illustrate: false,
        deepMemory: false, directive: false, reason: 'test',
      }),
      citations: [],
    });

    const entries: LiveEntry[] = [{
      id: 'e1',
      entry: { type: 'prose', content: 'I think ratios matter' } as LiveEntry['entry'],
      crossedOut: false,
      bookmarked: false,
      pinned: false,
      timestamp: Date.now(),
    }];

    await classifyImmediate('Tell me more', entries);
    expect(mockRunTextAgent).toHaveBeenCalled();
    const callArgs = mockRunTextAgent.mock.calls[0] as unknown[];
    const prompt = ((callArgs[1] as Array<{parts: Array<{text: string}>}>)[0]!.parts[0]!.text) as string;
    expect(prompt).toContain('ratios matter');
  });
});
