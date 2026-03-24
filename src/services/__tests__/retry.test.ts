/**
 * Tests for withRetry — single-retry logic for transient errors.
 */
import { describe, test, expect, vi } from 'vitest';
import { withRetry } from '../retry';

describe('withRetry', () => {
  test('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry('test-op', fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('retries once on transient error then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce('recovered');
    const result = await withRetry('test-op', fn);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('returns toolError envelope after both attempts fail with transient error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('503 service unavailable'))
      .mockRejectedValueOnce(new Error('503 still down'));
    const result = await withRetry('fetch-data', fn);
    const parsed = JSON.parse(result) as { status: string; data: string };
    expect(parsed.status).toBe('error');
    expect(parsed.data).toContain('fetch-data failed');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('does not retry on non-transient error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('invalid argument'));
    const result = await withRetry('validate', fn);
    const parsed = JSON.parse(result) as { status: string; data: string };
    expect(parsed.status).toBe('error');
    expect(parsed.data).toContain('validate failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('recognises timeout as transient', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('request timeout'))
      .mockResolvedValueOnce('ok after timeout');
    const result = await withRetry('slow-op', fn);
    expect(result).toBe('ok after timeout');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('recognises 429 as transient', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('429 rate limited'))
      .mockResolvedValueOnce('ok after rate limit');
    const result = await withRetry('rate-op', fn);
    expect(result).toBe('ok after rate limit');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
