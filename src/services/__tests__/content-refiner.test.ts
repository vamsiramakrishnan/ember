/**
 * Tests for content-refiner — iterative critique loop for structured content.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents/content-critic', () => ({
  CONTENT_CRITIC_AGENT: { name: 'mock-critic' },
}));

vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(),
}));

vi.mock('../critique-parser', () => ({
  parseCritiqueResponse: vi.fn(() => ({
    score: 10, issues: [], raw: {},
  })),
}));

vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));

import { refineContent } from '../content-refiner';
import type { NotebookEntry } from '@/types/entries';

describe('refineContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns immediately for unsupported entry types', async () => {
    const entry = { type: 'prose', content: 'text' } as NotebookEntry;
    const result = await refineContent(entry, 'prompt');
    expect(result.entry).toBe(entry);
    expect(result.iterations).toBe(0);
    expect(result.finalScore).toBe(10);
  });

  test('returns refined entry for reading-material', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({
      text: '{"score":9,"issues":[],"corrections":[]}',
      citations: [],
    });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 9,
      issues: [],
      raw: { corrections: [] },
    });

    const entry = {
      type: 'reading-material' as const,
      title: 'Test',
      slides: [{ heading: 'A', body: 'content', layout: 'content' }],
    } as NotebookEntry;

    const result = await refineContent(entry, 'test prompt');
    expect(result.iterations).toBe(1);
    expect(result.finalScore).toBe(9);
  });

  test('applies corrections when score is below threshold', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    let callCount = 0;
    vi.mocked(resilientTextAgent).mockImplementation(async () => {
      callCount++;
      return { text: 'response', citations: [] };
    });
    vi.mocked(parseCritiqueResponse).mockImplementation(() => {
      if (callCount === 1) {
        return {
          score: 4,
          issues: ['inaccurate date'],
          raw: { corrections: [{ index: 0, field: 'body', value: 'fixed' }] },
        };
      }
      return { score: 8, issues: [], raw: { corrections: [] } };
    });

    const entry = {
      type: 'reading-material' as const,
      title: 'Test',
      slides: [{ heading: 'A', body: 'wrong content', layout: 'content' }],
    } as NotebookEntry;

    const result = await refineContent(entry, 'test');
    expect(result.iterations).toBe(2);
    expect(result.history[0]?.patchCount).toBe(1);
  });

  test('stops when score meets threshold', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 8, issues: [], raw: { corrections: [] },
    });

    const entry = {
      type: 'flashcard-deck' as const,
      title: 'Cards',
      cards: [{ front: 'Q', back: 'A' }],
    } as NotebookEntry;

    const result = await refineContent(entry, 'test');
    expect(result.iterations).toBe(1);
    expect(result.finalScore).toBe(8);
  });
});
