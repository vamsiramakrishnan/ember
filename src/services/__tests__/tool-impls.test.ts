import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../file-search', () => ({
  getOrCreateStore: vi.fn(() => Promise.resolve('store')),
  searchNotebook: vi.fn(() => Promise.resolve({ text: 'notebook result' })),
  searchByType: vi.fn(() => Promise.resolve({ text: 'typed result' })),
  searchAll: vi.fn(() => Promise.resolve({ text: 'all result' })),
}));

vi.mock('../knowledge-graph', () => ({
  buildGraph: vi.fn(() => Promise.resolve({
    nodes: [{ id: 'n1', label: 'Kepler', kind: 'thinker' }],
    edges: [],
  })),
  getNeighbors: vi.fn(() => ({
    nodes: [
      { id: 'n1', label: 'Kepler', kind: 'thinker' },
      { id: 'n2', label: 'Harmonics', kind: 'concept' },
    ],
    edges: [{ from: 'n1', to: 'n2' }],
  })),
  getDelta: vi.fn(() => ({
    nodes: [{ id: 'n3', label: 'Ratio', kind: 'concept' }],
    edges: [],
  })),
  serializeSubgraph: vi.fn(() => 'serialized graph'),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  getLexiconByNotebook: vi.fn(() => Promise.resolve([
    { term: 'Ratio', definition: 'a/b', level: 'exploring', percentage: 10, etymology: 'Latin', crossReferences: [] },
  ])),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  getEncountersByNotebook: vi.fn(() => Promise.resolve([
    { thinker: 'Kepler', tradition: 'Astronomy', coreIdea: 'Planetary motion', status: 'active', date: '27 Dec' },
  ])),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  getMasteryByNotebook: vi.fn(() => Promise.resolve([
    { concept: 'Harmonics', level: 'developing', percentage: 40 },
  ])),
}));

vi.mock('../tool-result', () => ({
  toolOk: vi.fn((data: string) => JSON.stringify({ status: 'ok', data })),
  toolNotFound: vi.fn((entity: string) => JSON.stringify({ status: 'not-found', data: `Not found: ${entity}` })),
  toolError: vi.fn((op: string, msg: string) => JSON.stringify({ status: 'error', data: `${op}: ${msg}` })),
}));

import {
  executeSearch, lookupConcept, lookupThinker,
  lookupTerm, getConnections, getRecentChanges,
} from '../tool-impls';
import type { ToolContext } from '../tool-executor';

const ctx: ToolContext = { studentId: 's1', notebookId: 'n1' };

describe('tool-impls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSearch', () => {
    it('searches notebook by default scope', async () => {
      const result = await executeSearch({ query: 'Kepler' }, ctx);
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe('ok');
    });

    it('searches all scopes when scope is "all"', async () => {
      const { searchAll } = await import('../file-search');
      await executeSearch({ query: 'test', scope: 'all' }, ctx);
      expect(searchAll).toHaveBeenCalled();
    });

    it('searches by type for known scopes', async () => {
      const { searchByType } = await import('../file-search');
      await executeSearch({ query: 'test', scope: 'sessions' }, ctx);
      expect(searchByType).toHaveBeenCalledWith('store', 'test', 'session', 'n1');
    });

    it('returns not-found when search returns empty', async () => {
      const { searchNotebook } = await import('../file-search');
      (searchNotebook as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ text: '' });
      const result = await executeSearch({ query: 'nothing' }, ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });
  });

  describe('lookupConcept', () => {
    it('finds matching concept case-insensitively', async () => {
      const result = await lookupConcept('harmonics', ctx);
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe('ok');
    });

    it('returns not-found for unknown concept', async () => {
      const result = await lookupConcept('unknown-concept', ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });
  });

  describe('lookupThinker', () => {
    it('finds matching thinker case-insensitively', async () => {
      const result = await lookupThinker('kepler', ctx);
      expect(JSON.parse(result).status).toBe('ok');
    });

    it('returns not-found for unknown thinker', async () => {
      const result = await lookupThinker('Nobody', ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });
  });

  describe('lookupTerm', () => {
    it('finds matching term case-insensitively', async () => {
      const result = await lookupTerm('ratio', ctx);
      expect(JSON.parse(result).status).toBe('ok');
    });

    it('returns not-found for unknown term', async () => {
      const result = await lookupTerm('quasar', ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });
  });

  describe('getConnections', () => {
    it('returns subgraph for known entity', async () => {
      const result = await getConnections('Kepler', 1, ctx);
      expect(JSON.parse(result).status).toBe('ok');
    });

    it('returns not-found for unknown entity', async () => {
      const result = await getConnections('Unknown', 1, ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });

    it('caps depth at 3', async () => {
      const { getNeighbors } = await import('../knowledge-graph');
      await getConnections('Kepler', 10, ctx);
      expect(getNeighbors).toHaveBeenCalledWith(expect.anything(), 'n1', 3);
    });
  });

  describe('getRecentChanges', () => {
    it('returns delta for recent changes', async () => {
      const result = await getRecentChanges(30, ctx);
      expect(JSON.parse(result).status).toBe('ok');
    });

    it('returns not-found when no changes', async () => {
      const { getDelta } = await import('../knowledge-graph');
      (getDelta as ReturnType<typeof vi.fn>).mockReturnValueOnce({ nodes: [], edges: [] });
      const result = await getRecentChanges(5, ctx);
      expect(JSON.parse(result).status).toBe('not-found');
    });
  });
});
