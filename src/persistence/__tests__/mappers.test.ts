/**
 * Tests for record-to-view mappers — verify field mapping and persistence field dropping.
 */
import { describe, test, expect } from 'vitest';
import {
  encounterRecordToView,
  lexiconRecordToView,
  libraryRecordToView,
} from '../mappers';
import type { EncounterRecord, LexiconRecord, LibraryRecord } from '../records';

const baseFields = {
  id: 'rec-001',
  createdAt: 1700000000000,
  updatedAt: 1700000001000,
  studentId: 'stu-001',
  notebookId: 'nb-001',
};

describe('encounterRecordToView', () => {
  const record: EncounterRecord = {
    ...baseFields,
    ref: 'ENC-001',
    thinker: 'Johannes Kepler',
    tradition: 'Astronomy',
    coreIdea: 'Planetary orbits are elliptical',
    sessionTopic: 'Celestial Mechanics',
    date: '15 March 1619',
    status: 'active',
    bridgedTo: 'Newton',
    sourceEntryId: 'entry-42',
  };

  test('maps all view fields correctly', () => {
    const view = encounterRecordToView(record);
    expect(view.ref).toBe('ENC-001');
    expect(view.thinker).toBe('Johannes Kepler');
    expect(view.tradition).toBe('Astronomy');
    expect(view.coreIdea).toBe('Planetary orbits are elliptical');
    expect(view.sessionTopic).toBe('Celestial Mechanics');
    expect(view.date).toBe('15 March 1619');
    expect(view.status).toBe('active');
    expect(view.bridgedTo).toBe('Newton');
  });

  test('sets portraitUrl to undefined', () => {
    const view = encounterRecordToView(record);
    expect(view.portraitUrl).toBeUndefined();
  });

  test('drops persistence-only fields', () => {
    const view = encounterRecordToView(record);
    const keys = Object.keys(view);
    expect(keys).not.toContain('id');
    expect(keys).not.toContain('createdAt');
    expect(keys).not.toContain('updatedAt');
    expect(keys).not.toContain('studentId');
    expect(keys).not.toContain('sourceEntryId');
  });
});

describe('lexiconRecordToView', () => {
  const record: LexiconRecord = {
    ...baseFields,
    number: 7,
    term: 'Harmonic',
    pronunciation: '/hɑːˈmɒnɪk/',
    definition: 'A wave whose frequency is a whole-number multiple of a fundamental',
    level: 'developing',
    percentage: 45,
    etymology: 'Greek harmonikos',
    crossReferences: ['Resonance', 'Fourier'],
    sourceEntryId: 'entry-10',
  };

  test('maps all view fields correctly', () => {
    const view = lexiconRecordToView(record);
    expect(view.number).toBe(7);
    expect(view.term).toBe('Harmonic');
    expect(view.pronunciation).toBe('/hɑːˈmɒnɪk/');
    expect(view.definition).toBe('A wave whose frequency is a whole-number multiple of a fundamental');
    expect(view.level).toBe('developing');
    expect(view.percentage).toBe(45);
    expect(view.etymology).toBe('Greek harmonikos');
    expect(view.crossReferences).toEqual(['Resonance', 'Fourier']);
  });

  test('drops persistence-only fields', () => {
    const view = lexiconRecordToView(record);
    const keys = Object.keys(view);
    expect(keys).not.toContain('id');
    expect(keys).not.toContain('createdAt');
    expect(keys).not.toContain('updatedAt');
    expect(keys).not.toContain('studentId');
    expect(keys).not.toContain('notebookId');
  });
});

describe('libraryRecordToView', () => {
  const record: LibraryRecord = {
    ...baseFields,
    title: 'Harmonices Mundi',
    author: 'Johannes Kepler',
    isCurrent: true,
    annotationCount: 12,
    quote: 'The heavenly motions are nothing but a continuous song.',
  };

  test('maps all view fields correctly', () => {
    const view = libraryRecordToView(record);
    expect(view.title).toBe('Harmonices Mundi');
    expect(view.author).toBe('Johannes Kepler');
    expect(view.isCurrent).toBe(true);
    expect(view.annotationCount).toBe(12);
    expect(view.quote).toBe('The heavenly motions are nothing but a continuous song.');
  });

  test('sets coverUrl to undefined', () => {
    const view = libraryRecordToView(record);
    expect(view.coverUrl).toBeUndefined();
  });

  test('drops persistence-only fields', () => {
    const view = libraryRecordToView(record);
    const keys = Object.keys(view);
    expect(keys).not.toContain('id');
    expect(keys).not.toContain('createdAt');
    expect(keys).not.toContain('updatedAt');
    expect(keys).not.toContain('studentId');
    expect(keys).not.toContain('notebookId');
  });
});
