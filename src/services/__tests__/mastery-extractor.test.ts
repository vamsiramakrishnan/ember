/**
 * Tests for mastery-extractor — conversation analysis for mastery signals.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
  MODELS: { text: 'test', heavy: 'test', image: 'test', fallback: 'test', gemma: 'test' },
  getGeminiClient: vi.fn(() => null),
}));

vi.mock('../agents', () => ({
  RESEARCHER_AGENT: { name: 'mock-researcher' },
}));

vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(),
}));

import { extractMasterySignals } from '../mastery-extractor';
import { resilientTextAgent } from '../resilient-agent';
import { isGeminiAvailable } from '../gemini';
import type { MasterySignal } from '../mastery-extractor';

const mockResilent = vi.mocked(resilientTextAgent);
const mockIsAvailable = vi.mocked(isGeminiAvailable);

describe('extractMasterySignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
  });

  test('returns null when AI not available', async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await extractMasterySignals([
      { type: 'prose', content: 'text' },
      { type: 'prose', content: 'more' },
      { type: 'prose', content: 'again' },
    ]);
    expect(result).toBeNull();
  });

  test('returns null when fewer than 3 entries', async () => {
    const result = await extractMasterySignals([
      { type: 'prose', content: 'text' },
    ]);
    expect(result).toBeNull();
  });

  test('returns parsed mastery signals on success', async () => {
    const signal: MasterySignal = {
      concepts: [{ concept: 'limits', level: 'developing', percentage: 35 }],
      newTerms: [{ term: 'epsilon', definition: 'small positive number' }],
      encounters: [{ thinker: 'Cauchy', coreIdea: 'rigorous analysis' }],
    };
    mockResilent.mockResolvedValue({
      text: JSON.stringify(signal),
      citations: [],
    });

    const result = await extractMasterySignals([
      { type: 'prose', content: 'I think limits are about approaching a value' },
      { type: 'tutor-marginalia', content: 'Good intuition about limits' },
      { type: 'prose', content: 'Like epsilon-delta definitions?' },
    ]);
    expect(result).not.toBeNull();
    expect(result?.concepts).toHaveLength(1);
    expect(result?.concepts[0]?.concept).toBe('limits');
  });

  test('strips markdown fences from response', async () => {
    mockResilent.mockResolvedValue({
      text: '```json\n{"concepts":[],"newTerms":[],"encounters":[]}\n```',
      citations: [],
    });

    const result = await extractMasterySignals([
      { type: 'prose', content: 'a' },
      { type: 'prose', content: 'b' },
      { type: 'prose', content: 'c' },
    ]);
    expect(result).not.toBeNull();
    expect(result?.concepts).toEqual([]);
  });

  test('returns null on parse error', async () => {
    mockResilent.mockResolvedValue({
      text: 'not json',
      citations: [],
    });

    const result = await extractMasterySignals([
      { type: 'prose', content: 'a' },
      { type: 'prose', content: 'b' },
      { type: 'prose', content: 'c' },
    ]);
    expect(result).toBeNull();
  });

  test('filters entries without content', async () => {
    mockResilent.mockResolvedValue({
      text: '{"concepts":[],"newTerms":[],"encounters":[]}',
      citations: [],
    });

    const result = await extractMasterySignals([
      { type: 'prose', content: 'has content' },
      { type: 'divider' },
      { type: 'prose', content: 'also content' },
      { type: 'prose', content: 'third' },
    ]);
    expect(result).not.toBeNull();
  });
});
