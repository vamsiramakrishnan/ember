/**
 * Tests for json-parser.ts — shared JSON extraction from LLM text.
 */
import { describe, it, expect } from 'vitest';
import {
  extractJsonObject,
  extractJsonArray,
  parseStructured,
  stripFences,
} from '../json-parser';

describe('stripFences', () => {
  it('removes ```json fences', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('removes bare ``` fences', () => {
    expect(stripFences('```\n[1,2]\n```')).toBe('[1,2]');
  });

  it('removes ```typescript fences', () => {
    expect(stripFences('```typescript\nconst x = 1;\n```')).toBe('const x = 1;');
  });

  it('handles case-insensitive fence markers', () => {
    expect(stripFences('```JSON\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('returns plain text unchanged', () => {
    expect(stripFences('hello world')).toBe('hello world');
  });

  it('trims whitespace', () => {
    expect(stripFences('  \n {"a":1} \n  ')).toBe('{"a":1}');
  });
});

describe('extractJsonObject', () => {
  it('extracts a plain JSON object', () => {
    expect(extractJsonObject('{"type":"test","value":42}')).toEqual({
      type: 'test',
      value: 42,
    });
  });

  it('extracts JSON from markdown fences', () => {
    const input = '```json\n{"name":"hello"}\n```';
    expect(extractJsonObject(input)).toEqual({ name: 'hello' });
  });

  it('extracts JSON embedded in prose', () => {
    const input = 'Here is the result: {"key":"val"} and more text';
    expect(extractJsonObject(input)).toEqual({ key: 'val' });
  });

  it('returns null for invalid JSON', () => {
    expect(extractJsonObject('not json at all')).toBeNull();
  });

  it('falls back to raw parse for non-object JSON', () => {
    // extractJsonObject falls through to raw JSON.parse when no { } match,
    // so a valid array parses successfully (returns the array cast)
    expect(extractJsonObject('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('handles nested objects', () => {
    const input = '{"outer":{"inner":true}}';
    expect(extractJsonObject(input)).toEqual({ outer: { inner: true } });
  });
});

describe('extractJsonArray', () => {
  it('extracts a plain JSON array', () => {
    expect(extractJsonArray('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('extracts array from fenced markdown', () => {
    const input = '```json\n[{"a":1},{"b":2}]\n```';
    expect(extractJsonArray(input)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('extracts array embedded in prose', () => {
    const input = 'Results: [true, false] end';
    expect(extractJsonArray(input)).toEqual([true, false]);
  });

  it('returns null for invalid JSON', () => {
    expect(extractJsonArray('no arrays here')).toBeNull();
  });

  it('preserves generic type', () => {
    const result = extractJsonArray<number>('[10,20]');
    expect(result).toEqual([10, 20]);
  });
});

describe('parseStructured', () => {
  it('parses plain JSON', () => {
    const result = parseStructured<{ x: number }>('{"x":5}');
    expect(result).toEqual({ x: 5 });
  });

  it('strips fences before parsing', () => {
    const result = parseStructured<string[]>('```json\n["a","b"]\n```');
    expect(result).toEqual(['a', 'b']);
  });

  it('returns null for unparseable text', () => {
    expect(parseStructured('hello')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseStructured('')).toBeNull();
  });
});
