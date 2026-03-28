/**
 * Tests for enrichment — visualization and illustration generation.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents', () => ({
  ILLUSTRATOR_AGENT: { name: 'mock-illustrator' },
  VISUALISER_AGENT: { name: 'mock-visualiser' },
}));

vi.mock('../run-agent', () => ({
  runImageAgent: vi.fn(),
}));

vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(),
}));

vi.mock('../illustration-prompt', () => ({
  buildIllustrationPrompt: vi.fn(async () => 'built prompt'),
}));

vi.mock('../viz-components', () => ({
  EMBER_VIZ_CSS: '<style>css</style>',
  EMBER_VIZ_JS: '<script>js</script>',
}));

vi.mock('../artifact-refiner', () => ({
  refineArtifact: vi.fn(async (html: string) => ({
    html, iterations: 1, finalScore: 8, history: [],
  })),
}));

vi.mock('../image-refiner', () => ({
  refineIllustration: vi.fn(async (data: string, mime: string) => ({
    imageData: data, mimeType: mime, caption: 'refined',
    iterations: 1, finalScore: 8, history: [],
  })),
}));

import { generateVisualization, generateIllustration } from '../enrichment';

describe('generateVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns visualization entry on success', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockResolvedValue({
      text: '<div>concept map</div>',
      citations: [],
    });

    const result = await generateVisualization('quantum entanglement', []);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('visualization');
    expect(result?.html).toContain('<div>concept map</div>');
    expect(result?.html).toContain('<!DOCTYPE html>');
  });

  test('strips markdown fences from response', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockResolvedValue({
      text: '```html\n<div>content</div>\n```',
      citations: [],
    });

    const result = await generateVisualization('test', []);
    expect(result?.html).not.toContain('```');
  });

  test('returns null when agent returns empty', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockResolvedValue({ text: '', citations: [] });

    const result = await generateVisualization('test', []);
    expect(result).toBeNull();
  });

  test('returns null on error', async () => {
    const { resilientTextAgent } = await import('../resilient-agent');
    vi.mocked(resilientTextAgent).mockRejectedValue(new Error('fail'));

    const result = await generateVisualization('test', []);
    expect(result).toBeNull();
  });
});

describe('generateIllustration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns illustration entry on success', async () => {
    const { runImageAgent } = await import('../run-agent');
    vi.mocked(runImageAgent).mockResolvedValue({
      images: [{ data: 'base64img', mimeType: 'image/png' }],
      text: 'a sketch',
    });

    const result = await generateIllustration('concept', []);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('illustration');
  });

  test('returns null when no image generated', async () => {
    const { runImageAgent } = await import('../run-agent');
    vi.mocked(runImageAgent).mockResolvedValue({ images: [], text: '' });

    const result = await generateIllustration('concept', []);
    expect(result).toBeNull();
  });

  test('returns null on error', async () => {
    const { runImageAgent } = await import('../run-agent');
    vi.mocked(runImageAgent).mockRejectedValue(new Error('fail'));

    const result = await generateIllustration('concept', []);
    expect(result).toBeNull();
  });
});
