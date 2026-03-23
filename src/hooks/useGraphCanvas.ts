/**
 * useGraphCanvas — assembles knowledge graph data from persistence
 * into the shape needed by KnowledgeCanvas.
 *
 * Reads mastery, encounters, lexicon, and curiosity records to build
 * graph nodes, and relations to build edges. Filters out structural
 * relation types that are not meaningful on the canvas.
 */
import { useState, useMemo, useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { useStoreQuery } from '@/persistence/useStore';
import { Store } from '@/persistence/schema';
import { getByNotebook } from '@/persistence/repositories/graph';
import {
  getMasteryByNotebook,
  getCuriositiesByNotebook,
} from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { buildGraphData } from './buildGraphData';
import type { Relation } from '@/types/entity';
import type {
  MasteryRecord,
  CuriosityRecord,
  EncounterRecord,
  LexiconRecord,
} from '@/persistence/records';
import type { GraphNodeKind } from '@/types/graph-canvas';

const EMPTY_RELATIONS: Relation[] = [];
const EMPTY_MASTERY: MasteryRecord[] = [];
const EMPTY_ENCOUNTERS: EncounterRecord[] = [];
const EMPTY_LEXICON: LexiconRecord[] = [];
const EMPTY_CURIOSITIES: CuriosityRecord[] = [];

export function useGraphCanvas() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const [filters, setFilters] = useState<Set<GraphNodeKind>>(
    new Set(['concept', 'thinker', 'term', 'curiosity']),
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // ── Data sources ────────────────────────────────────────
  const { data: relations } = useStoreQuery(
    Store.Relations,
    () => nid ? getByNotebook(nid) : Promise.resolve(EMPTY_RELATIONS),
    EMPTY_RELATIONS,
    [nid],
  );
  const { data: mastery } = useStoreQuery(
    Store.Mastery,
    () => nid ? getMasteryByNotebook(nid) : Promise.resolve(EMPTY_MASTERY),
    EMPTY_MASTERY,
    [nid],
  );
  const { data: encounters } = useStoreQuery(
    Store.Encounters,
    () => nid ? getEncountersByNotebook(nid) : Promise.resolve(EMPTY_ENCOUNTERS),
    EMPTY_ENCOUNTERS,
    [nid],
  );
  const { data: lexicon } = useStoreQuery(
    Store.Lexicon,
    () => nid ? getLexiconByNotebook(nid) : Promise.resolve(EMPTY_LEXICON),
    EMPTY_LEXICON,
    [nid],
  );
  const { data: curiosities } = useStoreQuery(
    Store.Curiosities,
    () => nid ? getCuriositiesByNotebook(nid) : Promise.resolve(EMPTY_CURIOSITIES),
    EMPTY_CURIOSITIES,
    [nid],
  );

  // ── Build graph ─────────────────────────────────────────
  const { nodes, edges } = useMemo(
    () => buildGraphData(mastery, encounters, lexicon, curiosities, relations),
    [mastery, encounters, lexicon, curiosities, relations],
  );

  // ── Filter visible set ──────────────────────────────────
  const visibleNodes = useMemo(
    () => nodes.filter(n => filters.has(n.kind)),
    [nodes, filters],
  );
  const visibleIds = useMemo(
    () => new Set(visibleNodes.map(n => n.id)),
    [visibleNodes],
  );
  const visibleEdges = useMemo(
    () => edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to)),
    [edges, visibleIds],
  );

  const toggleFilter = useCallback((kind: GraphNodeKind) => {
    setFilters(prev => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });
  }, []);

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    allNodes: nodes,
    filters,
    toggleFilter,
    focusId, setFocusId,
    hoverId, setHoverId,
    notebookId: nid,
    isEmpty: nodes.length === 0,
  };
}
