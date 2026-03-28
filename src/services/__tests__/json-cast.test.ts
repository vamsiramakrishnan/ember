/**
 * Tests for json-cast.ts — robust JSON extraction from freeform LLM text.
 */
import { describe, it, expect } from 'vitest';
import { castJson, castJsonValid } from '../json-cast';

describe('castJson', () => {
  it('returns null for empty input', () => {
    expect(castJson('')).toBeNull();
    expect(castJson('   ')).toBeNull();
  });

  it('parses raw JSON directly', () => {
    expect(castJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a raw JSON array', () => {
    expect(castJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('extracts JSON from markdown fences', () => {
    const input = 'Here:\n```json\n{"key":"val"}\n```\nDone.';
    expect(castJson(input)).toEqual({ key: 'val' });
  });

  it('extracts JSON from bare fences', () => {
    const input = '```\n[10,20]\n```';
    expect(castJson(input)).toEqual([10, 20]);
  });

  it('extracts JSON embedded in prose via bracket matching', () => {
    const input = 'The answer is {"type":"test","value":42} as expected.';
    expect(castJson(input)).toEqual({ type: 'test', value: 42 });
  });

  it('handles nested brackets correctly', () => {
    const input = 'Result: {"a":{"b":[1,2]}} done';
    expect(castJson(input)).toEqual({ a: { b: [1, 2] } });
  });

  it('handles strings containing brackets', () => {
    const input = '{"text":"hello {world}"}';
    expect(castJson(input)).toEqual({ text: 'hello {world}' });
  });

  it('fixes trailing commas', () => {
    const input = 'answer: {"a":1,"b":2,}';
    expect(castJson(input)).toEqual({ a: 1, b: 2 });
  });

  it('fixes trailing commas in arrays', () => {
    const input = '[1,2,3,]';
    expect(castJson(input)).toEqual([1, 2, 3]);
  });

  it('returns null for truncated/unbalanced JSON', () => {
    expect(castJson('{"a":1')).toBeNull();
  });

  it('returns null for plain text with no JSON', () => {
    expect(castJson('Just some text without any JSON')).toBeNull();
  });

  it('picks the first bracket type that appears', () => {
    // Array comes before object
    const input = 'data [1] then {"a":2}';
    expect(castJson(input)).toEqual([1]);
  });

  it('handles escaped quotes in strings', () => {
    const input = '{"msg":"say \\"hello\\""}';
    expect(castJson(input)).toEqual({ msg: 'say "hello"' });
  });
});

describe('castJsonValid', () => {
  it('returns value when validator passes', () => {
    const isObj = (v: unknown): v is { a: number } =>
      typeof v === 'object' && v !== null && 'a' in v;
    expect(castJsonValid('{"a":1}', isObj)).toEqual({ a: 1 });
  });

  it('returns null when validator fails', () => {
    const isArr = (v: unknown): v is number[] => Array.isArray(v);
    expect(castJsonValid('{"a":1}', isArr)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    const always = (_v: unknown): _v is string => true;
    expect(castJsonValid('not json', always)).toBeNull();
  });

  it('returns null for empty input', () => {
    const always = (_v: unknown): _v is string => true;
    expect(castJsonValid('', always)).toBeNull();
  });
});
