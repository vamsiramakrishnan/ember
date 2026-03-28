/**
 * Tests for artifact-refiner — iterative critique/patch loop for HTML.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents', () => ({
  CRITIC_AGENT: { name: 'mock-critic' },
}));

vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(),
}));

vi.mock('../patch-applier', () => ({
  applyPatches: vi.fn((html: string) => html + ' [patched]'),
}));

vi.mock('../critique-parser', () => ({
  parseCritiqueResponse: vi.fn(() => ({
    score: 10, issues: [], raw: {},
  })),
}));

vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));

import { refineArtifact } from '../artifact-refiner';
import type { ChangeContract } from '../artifact-refiner';

describe('refineArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns immediately when first critique scores high', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 8, issues: [], raw: { patches: [] },
    });

    const result = await refineArtifact('<div>good</div>', 'test prompt');
    expect(result.iterations).toBe(1);
    expect(result.finalScore).toBe(8);
    expect(result.html).toBe('<div>good</div>');
  });

  test('applies patches when score is below threshold', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');
    const { applyPatches } = await import('../patch-applier');

    let callCount = 0;
    vi.mocked(resilientTextAgent).mockImplementation(async () => {
      callCount++;
      return { text: '', citations: [] };
    });
    vi.mocked(parseCritiqueResponse).mockImplementation(() => {
      if (callCount === 1) {
        return {
          score: 3,
          issues: ['wrong date'],
          raw: { patches: [{ search: 'old', replace: 'new' }] },
        };
      }
      return { score: 9, issues: [], raw: { patches: [] } };
    });

    const result = await refineArtifact('<div>old</div>', 'test');
    expect(result.iterations).toBe(2);
    expect(applyPatches).toHaveBeenCalled();
  });

  test('stops after MAX_ITERATIONS', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 2,
      issues: ['still bad'],
      raw: { patches: [{ search: 'x', replace: 'y' }] },
    });

    const result = await refineArtifact('<div>x</div>', 'test');
    expect(result.iterations).toBe(3);
  });

  test('includes contract hints when provided', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    const { parseCritiqueResponse } = await import('../critique-parser');

    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });
    vi.mocked(parseCritiqueResponse).mockReturnValue({
      score: 10, issues: [], raw: { patches: [] },
    });

    const contract: ChangeContract = {
      researchGrounded: true,
      thinkersMentioned: ['Euler'],
      conceptsMapped: ['calculus'],
      sourceUrls: ['https://example.com'],
    };

    const result = await refineArtifact('<div>html</div>', 'test', 'ctx', contract);
    expect(result.finalScore).toBe(10);
  });

  test('handles evaluation errors gracefully', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockRejectedValue(new Error('API error'));

    const result = await refineArtifact('<div>html</div>', 'test');
    expect(result.iterations).toBe(1);
    expect(result.finalScore).toBe(10); // defaults to high score on error
  });
});
