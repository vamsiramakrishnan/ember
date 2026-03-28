/**
 * Tests for learning-intelligence — analytical engine for graph insights.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/persistence/repositories/mastery', () => ({
  getMasteryByNotebook: vi.fn().mockResolvedValue([]),
  getCuriositiesByNotebook: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/persistence/repositories/encounters', () => ({
  getEncountersByNotebook: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/persistence/repositories/graph', () => ({
  getByNotebook: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/persistence/repositories/events', () => ({
  getSessionEvents: vi.fn().mockResolvedValue([]),
}));

import {
  findLearningGaps, computeTrajectories,
  suggestExplorations, trackThreads, findConceptClusters,
} from '../learning-intelligence';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getByNotebook } from '@/persistence/repositories/graph';
import { getSessionEvents } from '@/persistence/repositories/events';

describe('learning-intelligence', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('findLearningGaps', () => {
    test('returns empty for no concepts', async () => {
      expect(await findLearningGaps('nb1')).toEqual([]);
    });

    test('identifies weak concepts adjacent to strong ones', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'Ratio', percentage: 20, level: 'exploring', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
        { id: 'c2', concept: 'Harmony', percentage: 80, level: 'strong', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([
        { id: 'r1', notebookId: 'nb1', from: 'c1', to: 'c2', fromKind: 'concept', toKind: 'concept', type: 'explores', weight: 1, createdAt: 0 },
      ]);

      const gaps = await findLearningGaps('nb1');
      expect(gaps).toHaveLength(1);
      expect(gaps[0]!.concept).toBe('Ratio');
    });

    test('skips concepts above 60%', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'Strong', percentage: 70, level: 'strong', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
      ]);
      const gaps = await findLearningGaps('nb1');
      expect(gaps).toHaveLength(0);
    });
  });

  describe('computeTrajectories', () => {
    test('returns stalling trend when no mastery events', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'Test', percentage: 50, level: 'developing', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 100 },
      ]);
      vi.mocked(getSessionEvents).mockResolvedValue([]);

      const trajectories = await computeTrajectories('nb1', 'sess1');
      expect(trajectories).toHaveLength(1);
      expect(trajectories[0]!.trend).toBe('stalling');
      expect(trajectories[0]!.velocity).toBe(0);
    });
  });

  describe('trackThreads', () => {
    test('marks questions as open when no related entries', async () => {
      vi.mocked(getCuriositiesByNotebook).mockResolvedValue([
        { id: 'q1', question: 'Why?', studentId: 's1', notebookId: 'nb1', createdAt: 1000, updatedAt: 1000 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([]);

      const threads = await trackThreads('nb1');
      expect(threads).toHaveLength(1);
      expect(threads[0]!.status).toBe('open');
    });

    test('marks as partially-addressed with 1-2 related entries', async () => {
      vi.mocked(getCuriositiesByNotebook).mockResolvedValue([
        { id: 'q1', question: 'Why?', studentId: 's1', notebookId: 'nb1', createdAt: 1000, updatedAt: 1000 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([
        { id: 'r1', notebookId: 'nb1', from: 'q1', to: 'e1', fromKind: 'curiosity', toKind: 'entry', type: 'explores', weight: 1, createdAt: 0 },
      ]);
      const threads = await trackThreads('nb1');
      expect(threads[0]!.status).toBe('partially-addressed');
    });

    test('marks as resolved with 3+ related entries', async () => {
      vi.mocked(getCuriositiesByNotebook).mockResolvedValue([
        { id: 'q1', question: 'Why?', studentId: 's1', notebookId: 'nb1', createdAt: 1000, updatedAt: 1000 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([
        { id: 'r1', notebookId: 'nb1', from: 'q1', to: 'e1', fromKind: 'curiosity', toKind: 'entry', type: 'explores', weight: 1, createdAt: 0 },
        { id: 'r2', notebookId: 'nb1', from: 'e2', to: 'q1', fromKind: 'entry', toKind: 'curiosity', type: 'references', weight: 1, createdAt: 0 },
        { id: 'r3', notebookId: 'nb1', from: 'q1', to: 'e3', fromKind: 'curiosity', toKind: 'entry', type: 'explores', weight: 1, createdAt: 0 },
      ]);
      const threads = await trackThreads('nb1');
      expect(threads[0]!.status).toBe('resolved');
    });
  });

  describe('findConceptClusters', () => {
    test('returns empty for no concepts', async () => {
      expect(await findConceptClusters('nb1')).toEqual([]);
    });

    test('groups connected concepts into clusters', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'A', percentage: 70, level: 'strong', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
        { id: 'c2', concept: 'B', percentage: 40, level: 'developing', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
        { id: 'c3', concept: 'C', percentage: 20, level: 'exploring', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([
        { id: 'r1', notebookId: 'nb1', from: 'c1', to: 'c2', fromKind: 'concept', toKind: 'concept', type: 'explores', weight: 1, createdAt: 0 },
        // c3 is disconnected — should not be in cluster
      ]);

      const clusters = await findConceptClusters('nb1');
      expect(clusters).toHaveLength(1);
      expect(clusters[0]!.concepts).toHaveLength(2);
    });

    test('skips singletons', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'Alone', percentage: 50, level: 'developing', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
      ]);
      vi.mocked(getByNotebook).mockResolvedValue([]);
      const clusters = await findConceptClusters('nb1');
      expect(clusters).toHaveLength(0);
    });
  });

  describe('suggestExplorations', () => {
    test('suggests highly-connected low-mastery concepts', async () => {
      vi.mocked(getMasteryByNotebook).mockResolvedValue([
        { id: 'c1', concept: 'Hub', percentage: 20, level: 'exploring', studentId: 's1', notebookId: 'nb1', createdAt: 0, updatedAt: 0 },
      ]);
      vi.mocked(getEncountersByNotebook).mockResolvedValue([]);
      vi.mocked(getByNotebook).mockResolvedValue([
        { id: 'r1', from: 'c1', to: 'x1', notebookId: 'nb1', fromKind: 'concept', toKind: 'concept', type: 'explores', weight: 1, createdAt: 0 },
        { id: 'r2', from: 'c1', to: 'x2', notebookId: 'nb1', fromKind: 'concept', toKind: 'concept', type: 'explores', weight: 1, createdAt: 0 },
        { id: 'r3', from: 'c1', to: 'x3', notebookId: 'nb1', fromKind: 'concept', toKind: 'concept', type: 'explores', weight: 1, createdAt: 0 },
      ]);

      const suggestions = await suggestExplorations('nb1');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]!.targetKind).toBe('concept');
    });
  });
});
