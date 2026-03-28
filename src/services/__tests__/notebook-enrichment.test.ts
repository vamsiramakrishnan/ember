/**
 * Tests for notebook-enrichment — icon generation and metadata tagging.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini-image', () => ({
  generateImage: vi.fn(),
}));

vi.mock('../gemini', () => ({
  generateText: vi.fn(),
  isGeminiAvailable: vi.fn(() => true),
}));

vi.mock('@/persistence/repositories/notebooks', () => ({
  updateNotebook: vi.fn(async () => ({})),
}));

vi.mock('@/persistence', () => ({
  Store: { Notebooks: 'notebooks' },
  notify: vi.fn(),
}));

vi.mock('../agents/config', () => ({
  EMBER_DESIGN_CONTEXT: 'design context',
}));

vi.mock('@/tokens/colors', () => ({
  colors: { paper: '#F5F0EB', ink: '#2C2825' },
}));

describe('generateNotebookIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns null when AI not available', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(false);

    const { generateNotebookIcon } = await import('../notebook-enrichment');
    const result = await generateNotebookIcon('nb1', 'Math', 'calculus');
    expect(result).toBeNull();
  });

  test('returns data URL on success', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { generateImage } = await import('../gemini-image');
    vi.mocked(generateImage).mockResolvedValue({
      images: [{ data: 'base64data', mimeType: 'image/png' }],
      text: '',
    });

    const { generateNotebookIcon } = await import('../notebook-enrichment');
    const result = await generateNotebookIcon('nb1', 'Math', 'calculus');
    expect(result).toBe('data:image/png;base64,base64data');
  });

  test('returns null when no images generated', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { generateImage } = await import('../gemini-image');
    vi.mocked(generateImage).mockResolvedValue({ images: [], text: '' });

    const { generateNotebookIcon } = await import('../notebook-enrichment');
    const result = await generateNotebookIcon('nb1', 'Math', '');
    expect(result).toBeNull();
  });

  test('returns null on error', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { generateImage } = await import('../gemini-image');
    vi.mocked(generateImage).mockRejectedValue(new Error('fail'));

    const { generateNotebookIcon } = await import('../notebook-enrichment');
    const result = await generateNotebookIcon('nb1', 'Math', '');
    expect(result).toBeNull();
  });
});

describe('enrichNotebookMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns null when AI not available', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(false);

    const { enrichNotebookMetadata } = await import('../notebook-enrichment');
    const result = await enrichNotebookMetadata('nb1', 'Math', 'calc', ['entry']);
    expect(result).toBeNull();
  });

  test('returns parsed metadata on success', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);
    vi.mocked(gemini.generateText).mockResolvedValue(
      '{"tags":["calculus","limits"],"discipline":"mathematics","summary":"Exploring limits."}',
    );

    const { enrichNotebookMetadata } = await import('../notebook-enrichment');
    const result = await enrichNotebookMetadata('nb1', 'Math', 'calc', ['entry1']);
    expect(result).not.toBeNull();
    expect(result?.tags).toContain('calculus');
    expect(result?.discipline).toBe('mathematics');
  });

  test('parses metadata from markdown-fenced JSON', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);
    vi.mocked(gemini.generateText).mockResolvedValue(
      '```json\n{"tags":["art"],"discipline":"art","summary":"Painting."}\n```',
    );

    const { enrichNotebookMetadata } = await import('../notebook-enrichment');
    const result = await enrichNotebookMetadata('nb1', 'Art', 'painting', ['entry']);
    expect(result).not.toBeNull();
    expect(result?.tags).toContain('art');
  });

  test('returns null on parse failure', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);
    vi.mocked(gemini.generateText).mockResolvedValue('not json at all');

    const { enrichNotebookMetadata } = await import('../notebook-enrichment');
    const result = await enrichNotebookMetadata('nb1', 'Math', '', []);
    expect(result).toBeNull();
  });
});
