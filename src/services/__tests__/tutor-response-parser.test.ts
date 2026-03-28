/**
 * Tests for tutor-response-parser.ts — parses Gemini JSON into NotebookEntry.
 */
import { describe, it, expect } from 'vitest';
import { parseTutorResponse } from '../tutor-response-parser';

describe('parseTutorResponse', () => {
  it('parses tutor-marginalia', () => {
    const raw = JSON.stringify({ type: 'tutor-marginalia', content: 'A note.' });
    expect(parseTutorResponse(raw)).toEqual({ type: 'tutor-marginalia', content: 'A note.' });
  });

  it('parses tutor-question', () => {
    const raw = JSON.stringify({ type: 'tutor-question', content: 'Why?' });
    expect(parseTutorResponse(raw)).toEqual({ type: 'tutor-question', content: 'Why?' });
  });

  it('parses tutor-connection with emphasisEnd', () => {
    const raw = JSON.stringify({ type: 'tutor-connection', content: 'A relates to B', emphasisEnd: 10 });
    const result = parseTutorResponse(raw);
    expect(result).toEqual({
      type: 'tutor-connection', content: 'A relates to B', emphasisEnd: 10,
    });
  });

  it('defaults emphasisEnd to 0 when missing', () => {
    const raw = JSON.stringify({ type: 'tutor-connection', content: 'text' });
    const result = parseTutorResponse(raw);
    expect(result).toEqual({ type: 'tutor-connection', content: 'text', emphasisEnd: 0 });
  });

  it('parses thinker-card', () => {
    const raw = JSON.stringify({
      type: 'thinker-card',
      thinker: { name: 'Kepler', dates: '1571-1630', gift: 'Laws', bridge: 'Music' },
    });
    const result = parseTutorResponse(raw);
    expect(result).toEqual({
      type: 'thinker-card',
      thinker: { name: 'Kepler', dates: '1571-1630', gift: 'Laws', bridge: 'Music' },
    });
  });

  it('parses tutor-directive', () => {
    const raw = JSON.stringify({ type: 'tutor-directive', content: 'Go explore', action: 'search' });
    const result = parseTutorResponse(raw);
    expect(result).toEqual({ type: 'tutor-directive', content: 'Go explore', action: 'search' });
  });

  it('parses tutor-directive without action', () => {
    const raw = JSON.stringify({ type: 'tutor-directive', content: 'Think about it' });
    const result = parseTutorResponse(raw);
    expect(result).toEqual({ type: 'tutor-directive', content: 'Think about it', action: undefined });
  });

  it('parses concept-diagram with items', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'Node1', subLabel: 'Sub1' }],
    });
    const result = parseTutorResponse(raw);
    expect(result?.type).toBe('concept-diagram');
    if (result?.type === 'concept-diagram') {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.label).toBe('Node1');
    }
  });

  it('parses concept-diagram with edges', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'A' }, { label: 'B' }],
      edges: [{ from: 0, to: 1, label: 'causes', type: 'causes' }],
      title: 'Test Diagram',
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.edges).toHaveLength(1);
      expect(result.edges![0]!.type).toBe('causes');
      expect(result.title).toBe('Test Diagram');
    }
  });

  it('filters invalid edges (non-number from/to)', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'A' }],
      edges: [{ from: 'bad', to: 'bad' }, { from: 0, to: 0, label: 'self' }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.edges).toHaveLength(1);
    }
  });

  it('parses diagram nodes with mastery', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'X', mastery: { level: 'strong', percentage: 75 } }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.items[0]!.mastery).toEqual({ level: 'strong', percentage: 75 });
    }
  });

  it('defaults invalid mastery level to exploring', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'X', mastery: { level: 'invalid', percentage: 50 } }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.items[0]!.mastery?.level).toBe('exploring');
    }
  });

  it('parses diagram nodes with children', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'Parent', children: [{ label: 'Child' }] }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.items[0]!.children).toHaveLength(1);
      expect(result.items[0]!.children![0]!.label).toBe('Child');
    }
  });

  it('validates accent values', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'A', accent: 'sage' }, { label: 'B', accent: 'invalid' }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.items[0]!.accent).toBe('sage');
      expect(result.items[1]!.accent).toBeUndefined();
    }
  });

  it('validates entityKind values', () => {
    const raw = JSON.stringify({
      type: 'concept-diagram',
      items: [{ label: 'A', entityKind: 'concept' }, { label: 'B', entityKind: 'bogus' }],
    });
    const result = parseTutorResponse(raw);
    if (result?.type === 'concept-diagram') {
      expect(result.items[0]!.entityKind).toBe('concept');
      expect(result.items[1]!.entityKind).toBeUndefined();
    }
  });

  it('falls back to marginalia for unknown type with content', () => {
    const raw = JSON.stringify({ type: 'unknown-type', content: 'Some text' });
    expect(parseTutorResponse(raw)).toEqual({ type: 'tutor-marginalia', content: 'Some text' });
  });

  it('returns null for unknown type without content', () => {
    const raw = JSON.stringify({ type: 'unknown-type', data: 123 });
    expect(parseTutorResponse(raw)).toBeNull();
  });

  it('falls back to marginalia for non-JSON text', () => {
    expect(parseTutorResponse('Just plain text')).toEqual({
      type: 'tutor-marginalia', content: 'Just plain text',
    });
  });

  it('returns null for empty string', () => {
    expect(parseTutorResponse('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(parseTutorResponse('   ')).toBeNull();
  });
});
