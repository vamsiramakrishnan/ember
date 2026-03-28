/**
 * Tests for buildGraphData — assembles graph nodes and edges from records.
 */
import { describe, it, expect } from 'vitest';
import { buildGraphData } from '../buildGraphData';
import type { MasteryRecord, CuriosityRecord, EncounterRecord, LexiconRecord } from '@/persistence/records';
import type { Relation } from '@/types/entity';

const baseMastery: MasteryRecord = {
  id: 'm1', studentId: 's1', notebookId: 'n1',
  concept: 'Gravity', level: 'developing', percentage: 65,
  createdAt: 1000, updatedAt: 1000,
};

const baseEncounter: EncounterRecord = {
  id: 'e1', studentId: 's1', notebookId: 'n1',
  ref: '001', thinker: 'Newton', tradition: 'Physics',
  coreIdea: 'Laws of motion', sessionTopic: 'Mechanics',
  date: '1 Jan 2025', status: 'active',
  createdAt: 1000, updatedAt: 1000,
};

const baseLexicon: LexiconRecord = {
  id: 'l1', studentId: 's1', notebookId: 'n1',
  number: 1, term: 'Inertia', pronunciation: '',
  definition: 'Resistance to change', level: 'exploring',
  percentage: 30, etymology: '', crossReferences: [],
  createdAt: 1000, updatedAt: 1000,
};

const baseCuriosity: CuriosityRecord = {
  id: 'c1', studentId: 's1', notebookId: 'n1',
  question: 'Why does mass cause gravity?',
  createdAt: 1000, updatedAt: 1000,
};

describe('buildGraphData', () => {
  it('creates nodes from mastery records', () => {
    const { nodes } = buildGraphData([baseMastery], [], [], [], []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'm1', kind: 'concept', label: 'Gravity' });
  });

  it('creates nodes from encounters', () => {
    const { nodes } = buildGraphData([], [baseEncounter], [], [], []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'e1', kind: 'thinker', label: 'Newton' });
  });

  it('creates nodes from lexicon', () => {
    const { nodes } = buildGraphData([], [], [baseLexicon], [], []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'l1', kind: 'term', label: 'Inertia' });
  });

  it('creates nodes from curiosities', () => {
    const { nodes } = buildGraphData([], [], [], [baseCuriosity], []);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: 'c1', kind: 'curiosity' });
  });

  it('creates edges from non-structural relations', () => {
    const relation: Relation = {
      id: 'r1', notebookId: 'n1',
      from: 'm1', fromKind: 'concept', to: 'e1', toKind: 'thinker',
      type: 'references', weight: 1.0, createdAt: 1000,
    };
    const { edges } = buildGraphData([baseMastery], [baseEncounter], [], [], [relation]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'm1', to: 'e1', weight: 1.0 });
  });

  it('excludes structural relations', () => {
    const structural: Relation = {
      id: 'r2', notebookId: 'n1',
      from: 'm1', fromKind: 'concept', to: 'e1', toKind: 'thinker',
      type: 'session-contains', weight: 1.0, createdAt: 1000,
    };
    const { edges } = buildGraphData([baseMastery], [baseEncounter], [], [], [structural]);
    expect(edges).toHaveLength(0);
  });

  it('excludes edges where one node is missing', () => {
    const relation: Relation = {
      id: 'r3', notebookId: 'n1',
      from: 'm1', fromKind: 'concept', to: 'missing', toKind: 'thinker',
      type: 'references', weight: 1.0, createdAt: 1000,
    };
    const { edges } = buildGraphData([baseMastery], [], [], [], [relation]);
    expect(edges).toHaveLength(0);
  });

  it('returns empty for empty inputs', () => {
    const { nodes, edges } = buildGraphData([], [], [], [], []);
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('handles all record types together', () => {
    const { nodes } = buildGraphData(
      [baseMastery], [baseEncounter], [baseLexicon], [baseCuriosity], [],
    );
    expect(nodes).toHaveLength(4);
  });
});
