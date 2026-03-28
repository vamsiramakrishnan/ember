/**
 * Tests for state/index.ts — verifies all re-exports are available.
 */
import { describe, test, expect, vi } from 'vitest';

vi.mock('../session-state-persistence', () => ({
  persistStudentTurn: vi.fn(),
  persistTutorTurn: vi.fn(),
  persistTutorActivity: vi.fn(),
  loadSessionState: vi.fn().mockResolvedValue(null),
  setSessionIds: vi.fn(),
}));
vi.mock('@/persistence/repositories/graph', () => ({
  createRelation: vi.fn(),
  getByNotebook: vi.fn().mockResolvedValue([]),
}));

import * as StateIndex from '../index';

describe('state/index re-exports', () => {
  test('exports session state functions', () => {
    expect(typeof StateIndex.getSessionState).toBe('function');
    expect(typeof StateIndex.subscribeSessionState).toBe('function');
    expect(typeof StateIndex.resetSession).toBe('function');
    expect(typeof StateIndex.recordStudentTurn).toBe('function');
    expect(typeof StateIndex.recordTutorTurn).toBe('function');
  });

  test('exports composition guard', () => {
    expect(typeof StateIndex.checkComposition).toBe('function');
    expect(typeof StateIndex.filterByComposition).toBe('function');
  });

  test('exports entry graph', () => {
    expect(typeof StateIndex.addRelation).toBe('function');
    expect(typeof StateIndex.getFollowUpChain).toBe('function');
    expect(typeof StateIndex.clearGraph).toBe('function');
  });

  test('exports constellation projection', () => {
    expect(typeof StateIndex.projectEntry).toBe('function');
    expect(typeof StateIndex.projectEntries).toBe('function');
  });

  test('exports entity projector', () => {
    expect(typeof StateIndex.projectEntityCommands).toBe('function');
    expect(typeof StateIndex.projectEntityCommandsBatch).toBe('function');
  });

  test('exports learning intelligence', () => {
    expect(typeof StateIndex.findLearningGaps).toBe('function');
    expect(typeof StateIndex.computeTrajectories).toBe('function');
    expect(typeof StateIndex.findConceptClusters).toBe('function');
  });

  test('exports bootstrap progress', () => {
    expect(typeof StateIndex.startBootstrapProgress).toBe('function');
    expect(typeof StateIndex.updateBootstrapNode).toBe('function');
    expect(typeof StateIndex.finishBootstrapProgress).toBe('function');
  });
});
