/**
 * Tests for records — ensures record interfaces compile correctly.
 */
import { describe, test, expect } from 'vitest';
import type {
  StudentRecord, NotebookRecord,
  EntryRecord,
  BlobRecord, CanvasRecord,
} from '../records';

describe('records', () => {
  test('StudentRecord shape', () => {
    const r: StudentRecord = {
      id: 's1', createdAt: 0, updatedAt: 0,
      name: 'Arjun', displayName: 'Arjun', avatarSeed: 'xyz', totalMinutes: 0,
    };
    expect(r.name).toBe('Arjun');
  });

  test('NotebookRecord shape', () => {
    const r: NotebookRecord = {
      id: 'nb1', createdAt: 0, updatedAt: 0,
      studentId: 's1', title: 'Test', description: '',
      sessionCount: 0, isActive: true,
    };
    expect(r.isActive).toBe(true);
  });

  test('EntryRecord shape', () => {
    const r: EntryRecord = {
      id: 'e1', createdAt: 0, updatedAt: 0,
      sessionId: 's1', order: 1, type: 'prose',
      entry: { type: 'prose', content: 'test' },
      crossedOut: false, bookmarked: false, pinned: false,
    };
    expect(r.type).toBe('prose');
  });

  test('CanvasRecord shape', () => {
    const r: CanvasRecord = {
      id: 'c1', createdAt: 0, updatedAt: 0,
      sessionId: 'sess-1', positions: [], connections: [],
    };
    expect(r.sessionId).toBe('sess-1');
  });

  test('BlobRecord shape', () => {
    const r: BlobRecord = {
      hash: 'abc', data: new Blob(), mimeType: 'image/png',
      size: 1024, createdAt: 0,
    };
    expect(r.hash).toBe('abc');
  });
});
