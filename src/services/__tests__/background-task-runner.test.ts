import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../background-tasks', () => ({
  assessTasks: vi.fn(() =>
    Promise.resolve({
      updateThinkers: false,
      updateVocabulary: false,
      updateMastery: false,
      updateCuriosities: false,
    }),
  ),
  extractThinkers: vi.fn(() => Promise.resolve(0)),
  extractVocabulary: vi.fn(() => Promise.resolve(0)),
  updateMasteryFromEntry: vi.fn(() => Promise.resolve(0)),
}));

vi.mock('../inline-annotations', () => ({
  annotateRecentEntries: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  getMasteryByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  getEncountersByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  getLexiconByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/graph', () => ({
  createRelation: vi.fn(() => Promise.resolve()),
}));

vi.mock('../background-results', () => ({
  setBackgroundResults: vi.fn(),
}));

vi.mock('../entry-meta-labels', () => ({
  enqueueForLabeling: vi.fn(),
}));

import { runBackgroundTasks } from '../background-task-runner';
import { assessTasks, extractThinkers } from '../background-tasks';
import { annotateRecentEntries } from '../inline-annotations';
import { createRelation } from '@/persistence/repositories/graph';
import type { LiveEntry, NotebookEntry } from '@/types/entries';

describe('background-task-runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls assessTasks with student and tutor text', async () => {
    await runBackgroundTasks(
      'student text',
      [{ type: 'tutor-marginalia', content: 'tutor says' } as NotebookEntry],
      's1', 'n1', 'topic', [],
    );
    expect(assessTasks).toHaveBeenCalledWith(
      'student text',
      [expect.objectContaining({ type: 'tutor-marginalia' })],
    );
  });

  it('dispatches thinker extraction when signaled', async () => {
    (assessTasks as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      updateThinkers: true,
      updateVocabulary: false,
      updateMastery: false,
      updateCuriosities: false,
    });

    await runBackgroundTasks(
      'Kepler studied orbits',
      [{ type: 'tutor-marginalia', content: 'Indeed' } as NotebookEntry],
      's1', 'n1', 'Astronomy', [],
    );
    expect(extractThinkers).toHaveBeenCalled();
  });

  it('runs annotation when student entry exists', async () => {
    const entries: LiveEntry[] = [{
      id: 'e1',
      entry: { type: 'prose', content: 'student text' } as NotebookEntry,
      crossedOut: false,
      bookmarked: false,
      pinned: false,
      timestamp: Date.now(),
    }];

    await runBackgroundTasks(
      'student text',
      [{ type: 'tutor-marginalia', content: 'response' } as NotebookEntry],
      's1', 'n1', 'topic', entries,
    );
    expect(annotateRecentEntries).toHaveBeenCalled();
  });

  it('creates graph relation between student and tutor entries', async () => {
    const entries: LiveEntry[] = [
      {
        id: 'tutor-1',
        entry: { type: 'tutor-marginalia', content: 'response' } as NotebookEntry,
        crossedOut: false,
        bookmarked: false,
        pinned: false,
        timestamp: Date.now(),
      },
      {
        id: 'student-1',
        entry: { type: 'prose', content: 'student text' } as NotebookEntry,
        crossedOut: false,
        bookmarked: false,
        pinned: false,
        timestamp: Date.now(),
      },
    ];

    await runBackgroundTasks(
      'student text',
      [{ type: 'tutor-marginalia', content: 'response' } as NotebookEntry],
      's1', 'n1', 'topic', entries,
    );
    expect(createRelation).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'prompted-by' }),
    );
  });

  it('handles empty tutor entries gracefully', async () => {
    await expect(
      runBackgroundTasks('student text', [], 's1', 'n1', 'topic', []),
    ).resolves.not.toThrow();
  });
});
