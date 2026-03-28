/**
 * Tests for useEntryGraph — React hooks for entry relationship graph.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/persistence/repositories/graph', () => ({
  createRelation: vi.fn().mockResolvedValue({}),
  getByNotebook: vi.fn().mockResolvedValue([]),
}));

import { useEntryRelations, useEntryConnections } from '../useEntryGraph';
import { addRelation } from '../entry-graph';
import { relations, index, listeners } from '../entry-graph-internals';

describe('useEntryGraph hooks', () => {
  beforeEach(() => {
    relations.length = 0;
    index.byFrom.clear();
    index.byTo.clear();
    index.byType.clear();
    listeners.clear();
  });

  test('useEntryRelations returns current relations', () => {
    addRelation({ from: 'a', to: 'b', type: 'follow-up' });
    const { result } = renderHook(() => useEntryRelations());
    expect(result.current).toHaveLength(1);
  });

  test('useEntryConnections returns outgoing, incoming, and chain', () => {
    addRelation({ from: 'a', to: 'b', type: 'follow-up' });
    addRelation({ from: 'c', to: 'a', type: 'references' });
    const { result } = renderHook(() => useEntryConnections('a'));
    expect(result.current.outgoing).toHaveLength(1);
    expect(result.current.incoming).toHaveLength(1);
    expect(result.current.followUpChain).toContain('a');
  });
});
