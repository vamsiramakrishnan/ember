/**
 * Knowledge Graph — a traversable view of the student's
 * entire intellectual universe.
 *
 * Nodes: entries, concepts, thinkers, terms, sessions, notebooks
 * Edges: references, connections, bridges, annotations
 *
 * This is not a separate database — it's a lens over IndexedDB
 * that provides graph traversal semantics. The actual data lives
 * in the existing persistence layer.
 *
 * Key operations:
 * - getNeighbors(nodeId, depth) — k-th order traversal
 * - getSubgraph(nodeIds) — extract a connected subgraph
 * - getDelta(since) — what changed since a timestamp
 */
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getSessionsByNotebook } from '@/persistence/repositories/sessions';

// ─── Node types ──────────────────────────────────────────────────────

export type NodeType = 'concept' | 'thinker' | 'term' | 'session' | 'entry' | 'question';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string; // 'mentions' | 'bridges' | 'defines' | 'explores' | 'cross-ref'
  weight: number;   // 0-1, higher = stronger connection
}

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Build graph from IndexedDB ──────────────────────────────────────

/**
 * Build the full knowledge graph for a notebook.
 * Expensive — cache the result and use getDelta for updates.
 */
export async function buildGraph(notebookId: string): Promise<Subgraph> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const [sessions, lexicon, encounters, mastery, curiosities] = await Promise.all([
    getSessionsByNotebook(notebookId),
    getLexiconByNotebook(notebookId),
    getEncountersByNotebook(notebookId),
    getMasteryByNotebook(notebookId),
    getCuriositiesByNotebook(notebookId),
  ]);

  // Sessions → nodes
  for (const s of sessions) {
    nodes.push({
      id: `session:${s.id}`,
      type: 'session',
      label: `Session ${s.number}: ${s.topic}`,
      data: { number: s.number, topic: s.topic, date: s.date },
      updatedAt: s.updatedAt,
    });
  }

  // Concepts (mastery) → nodes
  for (const m of mastery) {
    nodes.push({
      id: `concept:${m.id}`,
      type: 'concept',
      label: m.concept,
      data: { level: m.level, percentage: m.percentage },
      updatedAt: m.updatedAt,
    });
  }

  // Thinkers → nodes
  for (const e of encounters) {
    nodes.push({
      id: `thinker:${e.id}`,
      type: 'thinker',
      label: e.thinker,
      data: { tradition: e.tradition, coreIdea: e.coreIdea, status: e.status },
      updatedAt: e.updatedAt,
    });
  }

  // Terms → nodes + cross-reference edges
  for (const l of lexicon) {
    nodes.push({
      id: `term:${l.id}`,
      type: 'term',
      label: l.term,
      data: { definition: l.definition, level: l.level, percentage: l.percentage },
      updatedAt: l.updatedAt,
    });

    // Cross-references → edges
    for (const ref of l.crossReferences) {
      const target = lexicon.find((t) => t.term === ref);
      if (target) {
        edges.push({
          from: `term:${l.id}`,
          to: `term:${target.id}`,
          relation: 'cross-ref',
          weight: 0.8,
        });
      }
    }
  }

  // Curiosities → nodes
  for (const c of curiosities) {
    nodes.push({
      id: `question:${c.id}`,
      type: 'question',
      label: c.question,
      data: {},
      updatedAt: c.updatedAt,
    });
  }

  // Infer edges from content (concept↔thinker, concept↔session)
  inferEdges(nodes, edges);

  return { nodes, edges };
}

/**
 * Get k-th order neighbors of a node.
 * depth=1: direct connections. depth=2: friends-of-friends.
 */
export function getNeighbors(
  graph: Subgraph,
  nodeId: string,
  depth: number = 1,
): Subgraph {
  const visited = new Set<string>([nodeId]);
  let frontier = [nodeId];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of graph.edges) {
        const neighbor = edge.from === id ? edge.to : edge.to === id ? edge.from : null;
        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  const nodes = graph.nodes.filter((n) => visited.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  return { nodes, edges };
}

/**
 * Get what changed since a timestamp.
 * Returns only nodes updated after `since`.
 */
export function getDelta(graph: Subgraph, since: number): Subgraph {
  const nodes = graph.nodes.filter((n) => n.updatedAt > since);
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));
  return { nodes, edges };
}

/** Serialize a subgraph to a compact text representation for agent context. */
export function serializeSubgraph(sub: Subgraph): string {
  if (sub.nodes.length === 0) return '(empty graph)';

  const lines: string[] = ['[Knowledge Graph]'];

  for (const node of sub.nodes) {
    const meta = Object.entries(node.data)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    lines.push(`  ${node.type}:"${node.label}" ${meta ? `(${meta})` : ''}`);
  }

  if (sub.edges.length > 0) {
    lines.push('  Connections:');
    for (const edge of sub.edges) {
      const fromNode = sub.nodes.find((n) => n.id === edge.from);
      const toNode = sub.nodes.find((n) => n.id === edge.to);
      if (fromNode && toNode) {
        lines.push(`    "${fromNode.label}" --${edge.relation}--> "${toNode.label}"`);
      }
    }
  }

  return lines.join('\n');
}

// ─── Internal ────────────────────────────────────────────────────────

/** Infer edges between nodes by name matching. */
function inferEdges(nodes: GraphNode[], edges: GraphEdge[]): void {
  const thinkers = nodes.filter((n) => n.type === 'thinker');
  const concepts = nodes.filter((n) => n.type === 'concept');
  const terms = nodes.filter((n) => n.type === 'term');

  // Thinker ↔ concept: if concept label appears in thinker's coreIdea
  for (const t of thinkers) {
    const idea = String(t.data.coreIdea ?? '').toLowerCase();
    for (const c of concepts) {
      if (idea.includes(c.label.toLowerCase())) {
        edges.push({ from: t.id, to: c.id, relation: 'explores', weight: 0.7 });
      }
    }
  }

  // Term ↔ concept: if term label matches concept label
  for (const term of terms) {
    for (const c of concepts) {
      if (term.label.toLowerCase() === c.label.toLowerCase()) {
        edges.push({ from: term.id, to: c.id, relation: 'defines', weight: 0.9 });
      }
    }
  }
}
