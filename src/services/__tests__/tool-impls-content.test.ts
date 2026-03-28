import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/persistence/repositories/entries', () => ({
  getEntry: vi.fn(),
}));

vi.mock('@/persistence/repositories/blobs', () => ({
  getBlob: vi.fn(),
}));

vi.mock('../entry-utils', () => ({
  extractContent: vi.fn(() => 'extracted content'),
}));

import { getEntryContent, readFileContent } from '../tool-impls-content';
import { getEntry } from '@/persistence/repositories/entries';
import { getBlob } from '@/persistence/repositories/blobs';

describe('tool-impls-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEntryContent', () => {
    it('returns error message for empty entry_id', async () => {
      const result = await getEntryContent('');
      expect(result).toContain('no entry_id');
    });

    it('returns not-found for missing entry', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await getEntryContent('missing-id');
      expect(result).toContain('not found');
    });

    it('returns structured data for reading-material entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'reading-material',
          title: 'Test Reading',
          subtitle: 'Subtitle',
          slides: [{ heading: 'Slide 1', layout: 'standard', body: 'Content', accent: 'sage' }],
        },
      });
      const result = await getEntryContent('rm-1');
      const parsed = JSON.parse(result);
      expect(parsed.type).toBe('reading-material');
      expect(parsed.slideCount).toBe(1);
    });

    it('returns structured data for flashcard-deck entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'flashcard-deck',
          title: 'Test Cards',
          cards: [{ front: 'Q', back: 'A', concept: 'test' }],
        },
      });
      const result = await getEntryContent('fc-1');
      const parsed = JSON.parse(result);
      expect(parsed.type).toBe('flashcard-deck');
      expect(parsed.cardCount).toBe(1);
    });

    it('returns structured data for exercise-set entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'exercise-set',
          title: 'Exercises',
          difficulty: 'medium',
          exercises: [{ prompt: 'Solve', format: 'short', concept: 'math', hints: ['hint1'] }],
        },
      });
      const result = await getEntryContent('ex-1');
      const parsed = JSON.parse(result);
      expect(parsed.exercises[0].hintCount).toBe(1);
    });

    it('returns structured data for code-cell entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'code-cell',
          language: 'python',
          source: 'print(1)',
          result: '1',
        },
      });
      const result = await getEntryContent('cc-1');
      const parsed = JSON.parse(result);
      expect(parsed.type).toBe('code-cell');
      expect(parsed.source).toBe('print(1)');
    });

    it('falls back to extractContent for unknown entry types', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: { type: 'prose', content: 'test' },
      });
      const result = await getEntryContent('p-1');
      expect(result).toBe('extracted content');
    });
  });

  describe('readFileContent', () => {
    it('returns error for empty entry_id', async () => {
      const result = await readFileContent('');
      expect(result).toContain('no entry_id');
    });

    it('returns not-found for missing entry', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await readFileContent('missing');
      expect(result).toContain('not found');
    });

    it('returns source for code-cell entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: { type: 'code-cell', source: 'x = 42', language: 'python', result: '' },
      });
      const result = await readFileContent('cc-1');
      expect(result).toBe('x = 42');
    });

    it('reads text blob for text-based file uploads', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'file-upload',
          file: { blobHash: 'h1', mimeType: 'text/plain', size: 100 },
        },
      });
      (getBlob as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { text: () => Promise.resolve('file content here') },
      });
      const result = await readFileContent('fu-1');
      expect(result).toBe('file content here');
    });

    it('suggests read_attachment for image files', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: {
          type: 'file-upload',
          file: { blobHash: 'h2', mimeType: 'image/png', size: 5000 },
        },
      });
      const result = await readFileContent('img-1');
      expect(result).toContain('image file');
      expect(result).toContain('read_attachment');
    });

    it('returns not-a-file for non-file entries', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: { type: 'prose', content: 'text' },
      });
      const result = await readFileContent('p-1');
      expect(result).toContain('not a file');
    });
  });
});
