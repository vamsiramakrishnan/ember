import { describe, it, expect } from 'vitest';
import { toolOk, toolNotFound, toolError, isTransientError } from '../tool-result';
import type { ToolResult } from '../tool-result';

describe('tool-result', () => {
  describe('toolOk', () => {
    it('returns a JSON envelope with status ok', () => {
      const result: ToolResult = JSON.parse(toolOk('hello'));
      expect(result.status).toBe('ok');
      expect(result.data).toBe('hello');
    });

    it('handles empty string data', () => {
      const result: ToolResult = JSON.parse(toolOk(''));
      expect(result.status).toBe('ok');
      expect(result.data).toBe('');
    });
  });

  describe('toolNotFound', () => {
    it('returns not-found status with entity name', () => {
      const result: ToolResult = JSON.parse(toolNotFound('Kepler'));
      expect(result.status).toBe('not-found');
      expect(result.data).toContain('Kepler');
      expect(result.data).toContain('not have explored');
    });
  });

  describe('toolError', () => {
    it('returns error status with operation and message', () => {
      const result: ToolResult = JSON.parse(toolError('search', 'timeout'));
      expect(result.status).toBe('error');
      expect(result.data).toContain('search');
      expect(result.data).toContain('timeout');
    });
  });

  describe('isTransientError', () => {
    it('detects network errors', () => {
      expect(isTransientError(new Error('network error'))).toBe(true);
    });

    it('detects timeout errors', () => {
      expect(isTransientError('Request timeout')).toBe(true);
    });

    it('detects 503 errors', () => {
      expect(isTransientError('HTTP 503 Service Unavailable')).toBe(true);
    });

    it('detects 429 rate limit errors', () => {
      expect(isTransientError('429 Too Many Requests')).toBe(true);
    });

    it('returns false for non-transient errors', () => {
      expect(isTransientError(new Error('Invalid argument'))).toBe(false);
    });

    it('handles non-string/error values', () => {
      expect(isTransientError(42)).toBe(false);
      expect(isTransientError(null)).toBe(false);
    });
  });
});
