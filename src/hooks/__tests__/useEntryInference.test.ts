/**
 * Tests for useEntryInference — entry type inference from student text.
 */
import { describe, test, expect } from 'vitest';
import { inferEntryType, createStudentEntry } from '../useEntryInference';

describe('inferEntryType', () => {
  test('returns "question" for text ending with "?"', () => {
    expect(inferEntryType('What is orbital resonance?')).toBe('question');
  });

  test('returns "question" even for long text ending with "?"', () => {
    expect(inferEntryType('If Kepler discovered his laws empirically, how did he verify them?')).toBe('question');
  });

  test('returns "hypothesis" for "I think..." prefix', () => {
    expect(inferEntryType('I think the harmonic series converges')).toBe('hypothesis');
  });

  test('returns "hypothesis" for "Maybe..." prefix', () => {
    expect(inferEntryType('Maybe the orbits are elliptical because of gravity')).toBe('hypothesis');
  });

  test('returns "hypothesis" for "Perhaps..." prefix', () => {
    expect(inferEntryType('Perhaps Euler saw a different pattern here')).toBe('hypothesis');
  });

  test('returns "hypothesis" for "I believe..." prefix', () => {
    expect(inferEntryType('I believe this connects to Fourier analysis')).toBe('hypothesis');
  });

  test('returns "hypothesis" for "What if..." prefix', () => {
    expect(inferEntryType('What if we applied the same logic to sound waves')).toBe('hypothesis');
  });

  test('hypothesis detection is case-insensitive', () => {
    expect(inferEntryType('I THINK this is important')).toBe('hypothesis');
  });

  test('returns "scratch" for short lowercase text', () => {
    expect(inferEntryType('harmonic series')).toBe('scratch');
    expect(inferEntryType('check this later')).toBe('scratch');
  });

  test('does not return "scratch" for short uppercase-start text', () => {
    expect(inferEntryType('Harmonic series')).toBe('prose');
  });

  test('does not return "scratch" for long lowercase text', () => {
    const longText = 'this is a much longer piece of text that exceeds eighty characters and should therefore be classified as prose';
    expect(inferEntryType(longText)).toBe('prose');
  });

  test('returns "prose" as default for normal sentences', () => {
    expect(inferEntryType('The harmonic series is fundamental to understanding music theory and planetary motion.')).toBe('prose');
  });

  test('trims whitespace before classifying', () => {
    expect(inferEntryType('  Is this a question?  ')).toBe('question');
    expect(inferEntryType('  i think so  ')).toBe('hypothesis');
  });

  test('"?" takes priority over hypothesis prefixes', () => {
    expect(inferEntryType('I think this is a question?')).toBe('question');
  });
});

describe('createStudentEntry', () => {
  test('creates a NotebookEntry with inferred type', () => {
    const entry = createStudentEntry('What is resonance?');
    expect(entry).toEqual({ type: 'question', content: 'What is resonance?' });
  });

  test('creates prose entry for normal text', () => {
    const entry = createStudentEntry('The planets move in elliptical orbits.');
    expect(entry).toEqual({ type: 'prose', content: 'The planets move in elliptical orbits.' });
  });

  test('creates hypothesis entry', () => {
    const entry = createStudentEntry('Maybe gravity is the key');
    expect(entry).toEqual({ type: 'hypothesis', content: 'Maybe gravity is the key' });
  });

  test('creates scratch entry', () => {
    const entry = createStudentEntry('notes on kepler');
    expect(entry).toEqual({ type: 'scratch', content: 'notes on kepler' });
  });
});
