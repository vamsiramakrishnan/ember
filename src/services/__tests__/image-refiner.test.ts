/**
 * Tests for image-refiner — iterative critique/edit loop for illustrations.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents/image-critic', () => ({
  IMAGE_CRITIC_AGENT: { name: 'mock-image-critic' },
}));

vi.mock('../agents', () => ({
  ILLUSTRATOR_AGENT: { name: 'mock-illustrator' },
}));

vi.mock('../run-agent', () => ({
  runImageAgent: vi.fn(),
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

import { refineIllustration } from '../image-refiner';

describe('refineIllustration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns immediately when first critique scores high', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 8, issues: [], raw: { editInstructions: '' },
    });

    const result = await refineIllustration('img-data', 'image/png', 'concept', 'caption');
    expect(result.iterations).toBe(1);
    expect(result.finalScore).toBe(8);
    expect(result.imageData).toBe('img-data');
    expect(result.caption).toBe('caption');
  });

  test('refines when score is below threshold', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');
    const { runImageAgent } = await import('../run-agent');

    let callCount = 0;
    vi.mocked(resilientTextAgent).mockImplementation(async () => {
      callCount++;
      return { text: '', citations: [] };
    });
    vi.mocked(parseCritiqueResponse).mockImplementation(() => {
      if (callCount === 1) {
        return {
          score: 3,
          issues: ['unclear labels'],
          raw: { editInstructions: 'fix the labels' },
        };
      }
      return { score: 9, issues: [], raw: { editInstructions: '' } };
    });

    vi.mocked(runImageAgent).mockResolvedValue({
      images: [{ data: 'refined-data', mimeType: 'image/png' }],
      text: 'refined',
    });

    const result = await refineIllustration('img', 'image/png', 'concept', 'cap');
    expect(result.iterations).toBe(2);
    expect(result.imageData).toBe('refined-data');
  });

  test('stops when edit returns null', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');
    const { runImageAgent } = await import('../run-agent');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 3, issues: ['bad'], raw: { editInstructions: 'fix it' },
    });
    vi.mocked(runImageAgent).mockResolvedValue({ images: [], text: '' });

    const result = await refineIllustration('img', 'image/png', 'test', 'cap');
    expect(result.iterations).toBe(1);
    expect(result.imageData).toBe('img');
  });

  test('handles critique error gracefully', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockRejectedValue(new Error('fail'));

    const result = await refineIllustration('img', 'image/png', 'test', 'cap');
    expect(result.finalScore).toBe(10);
    expect(result.iterations).toBe(1);
  });
});
