/**
 * Tests for content-drop-helpers — constants and utility functions.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  IMAGE_TYPES, DOC_TYPES, CODE_EXTENSIONS, URL_PATTERN, blobToDataUrl,
} from '../content-drop-helpers';

vi.mock('@/services/file-search', () => ({
  getOrCreateStore: vi.fn(),
  uploadRawFile: vi.fn(),
}));

describe('IMAGE_TYPES', () => {
  it('includes common image MIME types', () => {
    expect(IMAGE_TYPES).toContain('image/png');
    expect(IMAGE_TYPES).toContain('image/jpeg');
    expect(IMAGE_TYPES).toContain('image/gif');
    expect(IMAGE_TYPES).toContain('image/webp');
  });
});

describe('DOC_TYPES', () => {
  it('includes PDF', () => {
    expect(DOC_TYPES).toContain('application/pdf');
  });
});

describe('CODE_EXTENSIONS', () => {
  it('maps common extensions to languages', () => {
    expect(CODE_EXTENSIONS['js']).toBe('javascript');
    expect(CODE_EXTENSIONS['ts']).toBe('typescript');
    expect(CODE_EXTENSIONS['py']).toBe('python');
    expect(CODE_EXTENSIONS['rs']).toBe('rust');
  });

  it('returns undefined for unknown extensions', () => {
    expect(CODE_EXTENSIONS['xyz']).toBeUndefined();
  });
});

describe('URL_PATTERN', () => {
  it('matches HTTP URLs', () => {
    expect(URL_PATTERN.test('http://example.com')).toBe(true);
  });

  it('matches HTTPS URLs', () => {
    expect(URL_PATTERN.test('https://example.com/path')).toBe(true);
  });

  it('does not match plain text', () => {
    expect(URL_PATTERN.test('not a url')).toBe(false);
  });

  it('does not match ftp URLs', () => {
    expect(URL_PATTERN.test('ftp://example.com')).toBe(false);
  });
});

describe('blobToDataUrl', () => {
  it('converts a blob to a data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await blobToDataUrl(blob);
    expect(result).toMatch(/^data:text\/plain;base64,/);
  });

  it('handles empty blob', async () => {
    const blob = new Blob([], { type: 'text/plain' });
    const result = await blobToDataUrl(blob);
    expect(result).toMatch(/^data:/);
  });
});
