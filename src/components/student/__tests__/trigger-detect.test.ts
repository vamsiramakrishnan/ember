import { describe, test, expect } from 'vitest';
import { detectTrigger, replaceTrigger } from '../trigger-detect';

describe('detectTrigger', () => {
  test('detects @ mention trigger', () => {
    const result = detectTrigger('Hello @Kep', 10);
    expect(result.type).toBe('mention');
    expect(result.query).toBe('Kep');
  });

  test('detects bare @ with no characters', () => {
    const result = detectTrigger('Hello @', 7);
    expect(result.type).toBe('mention');
    expect(result.query).toBe('');
  });

  test('detects / slash trigger', () => {
    const result = detectTrigger('/expl', 5);
    expect(result.type).toBe('slash');
    expect(result.query).toBe('expl');
  });

  test('detects / after whitespace', () => {
    const result = detectTrigger('some text /draw', 15);
    expect(result.type).toBe('slash');
    expect(result.query).toBe('draw');
  });

  test('returns null when no trigger', () => {
    const result = detectTrigger('Hello world', 11);
    expect(result.type).toBeNull();
  });

  test('handles @ mentions with spaces in names', () => {
    const result = detectTrigger('Hello @Jean-Baptiste', 20);
    expect(result.type).toBe('mention');
    expect(result.query).toBe('Jean-Baptiste');
  });

  test('trims trailing whitespace from mention query', () => {
    const result = detectTrigger('Hello @Kepler  ', 14);
    expect(result.type).toBe('mention');
    expect(result.query).toBe('Kepler');
  });

  test('returns correct position for @ mention', () => {
    const result = detectTrigger('Hi @Test', 8);
    expect(result.position).toBe(3);
  });
});

describe('replaceTrigger', () => {
  test('replaces @ mention trigger with insert text', () => {
    const result = replaceTrigger('Hello @Kep', 6, '@[Kepler](thinker:k1) ');
    expect(result).toContain('@[Kepler](thinker:k1)');
    expect(result).toContain('Hello');
  });

  test('replaces / trigger with insert text', () => {
    const result = replaceTrigger('text /expl', 5, '/explain ');
    expect(result).toContain('/explain');
  });

  test('replaces full trigger token including trailing word chars', () => {
    // The regex consumes @Kep (and spaces + word chars after), so "more text" is part of the token
    const result = replaceTrigger('Hello @Kep', 6, '@[Kepler](thinker:k1) ');
    expect(result).toBe('Hello @[Kepler](thinker:k1) ');
  });
});
