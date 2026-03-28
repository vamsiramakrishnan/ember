import { describe, test, expect } from 'vitest';
import { TYPE_META, isStudentEntry } from '../entryTypeMeta';

describe('entryTypeMeta', () => {
  describe('TYPE_META', () => {
    test('contains label for prose type', () => {
      expect(TYPE_META['prose']).toEqual({ label: 'prose' });
    });

    test('marks tutor-marginalia as tinted', () => {
      expect(TYPE_META['tutor-marginalia']?.tinted).toBe(true);
    });

    test('marks hypothesis as tinted', () => {
      expect(TYPE_META['hypothesis']?.tinted).toBe(true);
    });

    test('marks question as tinted', () => {
      expect(TYPE_META['question']?.tinted).toBe(true);
    });

    test('does not mark prose as tinted', () => {
      expect(TYPE_META['prose']?.tinted).toBeUndefined();
    });

    test('has a label for silence', () => {
      expect(TYPE_META['silence']?.label).toBe('···');
    });

    test('has a label for divider', () => {
      expect(TYPE_META['divider']?.label).toBe('—');
    });
  });

  describe('isStudentEntry', () => {
    test('returns true for prose', () => {
      expect(isStudentEntry('prose')).toBe(true);
    });

    test('returns true for question', () => {
      expect(isStudentEntry('question')).toBe(true);
    });

    test('returns true for hypothesis', () => {
      expect(isStudentEntry('hypothesis')).toBe(true);
    });

    test('returns true for scratch', () => {
      expect(isStudentEntry('scratch')).toBe(true);
    });

    test('returns true for code-cell', () => {
      expect(isStudentEntry('code-cell')).toBe(true);
    });

    test('returns true for image', () => {
      expect(isStudentEntry('image')).toBe(true);
    });

    test('returns false for tutor-marginalia', () => {
      expect(isStudentEntry('tutor-marginalia')).toBe(false);
    });

    test('returns false for silence', () => {
      expect(isStudentEntry('silence')).toBe(false);
    });

    test('returns false for divider', () => {
      expect(isStudentEntry('divider')).toBe(false);
    });

    test('returns false for unknown type', () => {
      expect(isStudentEntry('unknown')).toBe(false);
    });
  });
});
