/**
 * Tests for critique-parser — structured extraction from LLM critique responses.
 */
import { describe, test, expect } from 'vitest';
import { parseCritiqueResponse } from '../critique-parser';

describe('parseCritiqueResponse', () => {
  test('parses valid JSON with score and issues', () => {
    const input = JSON.stringify({ score: 7, issues: ['Too verbose', 'Missing context'] });
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(7);
    expect(result.issues).toEqual(['Too verbose', 'Missing context']);
  });

  test('returns raw parsed object', () => {
    const input = JSON.stringify({
      score: 8,
      issues: ['Minor'],
      patches: ['fix line 3'],
      corrections: ['spelling'],
    });
    const result = parseCritiqueResponse(input);
    expect(result.raw.patches).toEqual(['fix line 3']);
    expect(result.raw.corrections).toEqual(['spelling']);
  });

  test('returns defaults for empty string', () => {
    const result = parseCritiqueResponse('');
    expect(result.score).toBe(10);
    expect(result.issues).toEqual([]);
    expect(result.raw).toEqual({});
  });

  test('returns defaults for invalid JSON', () => {
    const result = parseCritiqueResponse('this is not json at all');
    expect(result.score).toBe(10);
    expect(result.issues).toEqual([]);
    expect(result.raw).toEqual({});
  });

  test('handles missing score field', () => {
    const input = JSON.stringify({ issues: ['Problem A'] });
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(10);
    expect(result.issues).toEqual(['Problem A']);
  });

  test('handles missing issues field', () => {
    const input = JSON.stringify({ score: 5 });
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(5);
    expect(result.issues).toEqual([]);
  });

  test('handles non-number score', () => {
    const input = JSON.stringify({ score: 'high', issues: [] });
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(10);
  });

  test('handles non-array issues', () => {
    const input = JSON.stringify({ score: 6, issues: 'not an array' });
    const result = parseCritiqueResponse(input);
    expect(result.issues).toEqual([]);
  });

  test('extracts JSON from markdown fenced block', () => {
    const input = '```json\n{"score": 3, "issues": ["Bad"]}\n```';
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(3);
    expect(result.issues).toEqual(['Bad']);
  });

  test('extracts JSON embedded in prose', () => {
    const input = 'Here is my critique: {"score": 9, "issues": []}. That is all.';
    const result = parseCritiqueResponse(input);
    expect(result.score).toBe(9);
    expect(result.issues).toEqual([]);
  });
});
