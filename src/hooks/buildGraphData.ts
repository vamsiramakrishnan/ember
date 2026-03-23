/**
 * buildGraphData — pure function that assembles GraphNode[] and GraphEdge[]
 * from persistence records. Extracted from useGraphCanvas for the 150-line rule.
 */
import type {
  MasteryRecord,
  CuriosityRecord,
  EncounterRecord,
  LexiconRecord,
} from '@/persistence/records';
import type { Relation } from '@/types/entity';
import type { GraphNode, GraphNodeKind, GraphEdge } from '@/types/graph-canvas';

/** Relation types that represent containment/structure, not knowledge links. */
const STRUCTURAL_TYPES = new Set([
  'session-contains',
  'notebook-contains',
  'annotates',
]);

export function buildGraphData(
  mastery: MasteryRecord[],
  encounters: EncounterRecord[],
  lexicon: LexiconRecord[],
  curiosities: CuriosityRecord[],
  relations: Relation[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>();

  for (const m of mastery) {
    nodeMap.set(m.id, makeNode(m.id, 'concept', m.concept, {
      percentage: m.percentage, level: m.level,
    }));
  }
  for (const e of encounters) {
    nodeMap.set(e.id, makeNode(e.id, 'thinker', e.thinker, {
      tradition: e.tradition, status: e.status,
    }));
  }
  for (const l of lexicon) {
    nodeMap.set(l.id, makeNode(l.id, 'term', l.term, {
      percentage: l.percentage, level: l.level,
    }));
  }
  for (const c of curiosities) {
    nodeMap.set(c.id, makeNode(c.id, 'curiosity', c.question));
  }

  const edges: GraphEdge[] = [];
  for (const r of relations) {
    if (STRUCTURAL_TYPES.has(r.type)) continue;
    if (!nodeMap.has(r.from) || !nodeMap.has(r.to)) continue;
    edges.push({
      id: r.id,
      from: r.from,
      to: r.to,
      type: r.type,
      weight: r.weight ?? 1,
      label: r.meta,
    });
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}

interface NodeSource {
  percentage?: number;
  level?: string;
  tradition?: string;
  status?: string;
}

function makeNode(
  id: string,
  kind: GraphNodeKind,
  label: string,
  source?: NodeSource,
): GraphNode {
  return {
    id,
    kind,
    label,
    mastery: source?.percentage,
    masteryLevel: source?.level as GraphNode['masteryLevel'],
    tradition: source?.tradition,
    status: source?.status as GraphNode['status'],
    x: 0, y: 0, vx: 0, vy: 0, pinned: false,
  };
}
