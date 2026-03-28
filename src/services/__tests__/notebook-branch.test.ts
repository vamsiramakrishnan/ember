/**
 * Tests for notebook-branch — forking notebooks from entries.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/persistence', () => ({
  Store: { Notebooks: 'n', Sessions: 's', Entries: 'e', Encounters: 'enc', Lexicon: 'l', Mastery: 'm' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/notebooks', () => ({
  createNotebook: vi.fn(async () => ({ id: 'nb-new', studentId: 's1', title: 'Branch' })),
}));

vi.mock('@/persistence/repositories/sessions', () => ({
  createSession: vi.fn(async () => ({ id: 'sess-new' })),
}));

vi.mock('@/persistence/repositories/entries', () => ({
  createEntry: vi.fn(async () => ({ id: 'e1' })),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  getEncountersByNotebook: vi.fn(async () => [
    { status: 'active', ref: 'T1', thinker: 'Euler', tradition: 'math', coreIdea: 'analysis', sessionTopic: 'calc', date: '1 Jan' },
    { status: 'dormant', ref: 'T2', thinker: 'Newton', tradition: 'physics', coreIdea: 'gravity', sessionTopic: 'mechanics', date: '2 Jan' },
  ]),
  createEncounter: vi.fn(async () => ({ id: 'enc-new' })),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  getLexiconByNotebook: vi.fn(async () => [
    { percentage: 50, term: 'limit', pronunciation: '', definition: 'def', level: 'developing', etymology: '', crossReferences: [] },
    { percentage: 10, term: 'series', pronunciation: '', definition: 'def', level: 'exploring', etymology: '', crossReferences: [] },
  ]),
  createLexiconEntry: vi.fn(async () => ({ id: 'lex-new' })),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  getMasteryByNotebook: vi.fn(async () => [
    { id: 'm1', percentage: 40, concept: 'limits', level: 'developing' },
    { id: 'm2', percentage: 20, concept: 'series', level: 'exploring' },
  ]),
  upsertMastery: vi.fn(async () => ({ id: 'mas-new' })),
}));

vi.mock('./notebook-enrichment', () => ({
  generateNotebookIcon: vi.fn(async () => null),
  enrichNotebookMetadata: vi.fn(async () => null),
}));

import { branchNotebook } from '../notebook-branch';

describe('branchNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('creates new notebook and session', async () => {
    const result = await branchNotebook({
      studentId: 's1',
      parentNotebookId: 'nb-parent',
      branchTitle: 'Deep dive',
      branchQuestion: 'What about limits?',
      seedContent: 'Exploring the concept of limits...',
    });

    expect(result.notebook.id).toBe('nb-new');

    const { createNotebook } = await import('@/persistence/repositories/notebooks');
    expect(createNotebook).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Deep dive' }),
    );

    const { createSession } = await import('@/persistence/repositories/sessions');
    expect(createSession).toHaveBeenCalled();
  });

  test('seeds echo entry with branch context', async () => {
    await branchNotebook({
      studentId: 's1',
      parentNotebookId: 'nb-parent',
      branchTitle: 'Branch',
      branchQuestion: 'q',
      seedContent: 'seed content here',
    });

    const { createEntry } = await import('@/persistence/repositories/entries');
    expect(createEntry).toHaveBeenCalledWith(
      'sess-new',
      expect.objectContaining({ type: 'echo' }),
    );
  });

  test('inherits only active/bridged encounters', async () => {
    await branchNotebook({
      studentId: 's1',
      parentNotebookId: 'nb-parent',
      branchTitle: 'Branch',
      branchQuestion: 'q',
      seedContent: 'seed',
    });

    const { createEncounter } = await import('@/persistence/repositories/encounters');
    // Only the active encounter should be copied (not dormant)
    expect(createEncounter).toHaveBeenCalledTimes(1);
  });

  test('inherits only vocabulary at 30%+ mastery', async () => {
    await branchNotebook({
      studentId: 's1',
      parentNotebookId: 'nb-parent',
      branchTitle: 'Branch',
      branchQuestion: 'q',
      seedContent: 'seed',
    });

    const { createLexiconEntry } = await import('@/persistence/repositories/lexicon');
    // Only the 50% term, not the 10% one
    expect(createLexiconEntry).toHaveBeenCalledTimes(1);
  });

  test('inherits only mastery at 30%+', async () => {
    await branchNotebook({
      studentId: 's1',
      parentNotebookId: 'nb-parent',
      branchTitle: 'Branch',
      branchQuestion: 'q',
      seedContent: 'seed',
    });

    const { upsertMastery } = await import('@/persistence/repositories/mastery');
    // Only the 40% concept, not the 20% one
    expect(upsertMastery).toHaveBeenCalledTimes(1);
  });
});
