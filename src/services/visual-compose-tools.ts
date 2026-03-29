/**
 * Visual Compose Tools — tool implementations for compose_visual
 * and merge_visual_delta.
 *
 * compose_visual: Pulls real graph data, classifies layout, finds
 * existing diagram entries for delta merging.
 *
 * merge_visual_delta: Patches an existing concept-diagram entry with
 * new nodes, new edges, and updated mastery data.
 */
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getByNotebook } from '@/persistence/repositories/graph';
import { getEntriesBySession } from '@/persistence/repositories/entries';
import type { DiagramLayout, DiagramEdge } from '@/types/entries';
import type { GraphToolContext } from './graph-tool-executor';

// ─── compose_visual ─────────────────────────────────────────────

export async function execComposeVisual(
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  const topic = String(args.topic ?? '');
  const concepts = Array.isArray(args.concepts) ? args.concepts.map(String) : [];
  const intent = String(args.intent ?? 'web');
  const sessionId = String(args.sessionId ?? '');

  // 1. Pull mastery data for mentioned concepts
  const mastery = await getMasteryByNotebook(ctx.notebookId);
  const encounters = await getEncountersByNotebook(ctx.notebookId);
  const relations = await getByNotebook(ctx.notebookId);

  // 2. Match concepts to mastery records
  const lowerConcepts = concepts.map((c) => c.toLowerCase());
  const matchedConcepts = mastery.filter((m) =>
    lowerConcepts.some((c) => m.concept.toLowerCase().includes(c) || c.includes(m.concept.toLowerCase())) ||
    m.concept.toLowerCase().includes(topic.toLowerCase()),
  );

  // 3. Build enriched nodes with real mastery data
  const enrichedNodes: Array<{
    label: string;
    subLabel: string;
    entityId: string;
    entityKind: string;
    mastery: { level: string; percentage: number };
    accent: string;
    connections: number;
  }> = [];

  for (const m of matchedConcepts.slice(0, 8)) {
    const connectionCount = relations.filter(
      (r) => r.from === m.id || r.to === m.id,
    ).length;

    enrichedNodes.push({
      label: m.concept,
      subLabel: `${m.level} · ${m.percentage}%`,
      entityId: m.id,
      entityKind: 'concept',
      mastery: { level: m.level, percentage: m.percentage },
      accent: m.level === 'mastered' ? 'sage' : m.level === 'strong' ? 'indigo' : 'amber',
      connections: connectionCount,
    });
  }

  // 4. Match thinkers
  const matchedThinkers = encounters.filter((e) =>
    lowerConcepts.some((c) => e.thinker.toLowerCase().includes(c)) ||
    e.coreIdea.toLowerCase().includes(topic.toLowerCase()),
  );

  for (const t of matchedThinkers.slice(0, 3)) {
    enrichedNodes.push({
      label: t.thinker,
      subLabel: t.coreIdea,
      entityId: t.id,
      entityKind: 'thinker',
      mastery: { level: 'exploring', percentage: 0 },
      accent: 'margin',
      connections: 0,
    });
  }

  // 5. Build edges from real graph relations
  const nodeIdToIndex = new Map(enrichedNodes.map((n, i) => [n.entityId, i]));
  const suggestedEdges: Array<{
    from: number; to: number; label: string; type: string;
  }> = [];

  for (const r of relations) {
    const fromIdx = nodeIdToIndex.get(r.from);
    const toIdx = nodeIdToIndex.get(r.to);
    if (fromIdx !== undefined && toIdx !== undefined) {
      suggestedEdges.push({
        from: fromIdx,
        to: toIdx,
        label: r.type as string,
        type: mapRelationType(r.type as string) ?? 'enables',
      });
    }
  }

  // 6. Classify best layout
  const suggestedLayout = classifyLayout(intent, enrichedNodes.length, suggestedEdges.length);

  // 7. Check for existing diagram entry on this topic
  let existingEntryId: string | null = null;
  if (sessionId) {
    try {
      const entries = await getEntriesBySession(sessionId);
      const existing = entries.find((e) => {
        if (e.type !== 'concept-diagram') return false;
        const content = e as { title?: string; items?: Array<{ label: string }> };
        if (content.title?.toLowerCase().includes(topic.toLowerCase())) return true;
        return content.items?.some((item) =>
          item.label.toLowerCase().includes(topic.toLowerCase()),
        );
      });
      if (existing) existingEntryId = existing.id ?? null;
    } catch { /* session lookup failed, ok */ }
  }

  return JSON.stringify({
    suggestedLayout,
    existingEntryId,
    enrichedItems: enrichedNodes,
    suggestedEdges,
    topicSummary: `${enrichedNodes.length} concepts, ${matchedThinkers.length} thinkers, ${suggestedEdges.length} relationships found`,
  });
}

// ─── merge_visual_delta ─────────────────────────────────────────

export async function execMergeVisualDelta(
  args: Record<string, unknown>,
): Promise<string> {
  const entryId = String(args.entryId ?? '');
  const addNodes = Array.isArray(args.addNodes) ? args.addNodes : [];
  const addEdges = Array.isArray(args.addEdges) ? args.addEdges : [];
  const updateNodes = Array.isArray(args.updateNodes) ? args.updateNodes : [];
  const newLayout = typeof args.newLayout === 'string' ? args.newLayout : null;

  return JSON.stringify({
    action: 'merge_delta',
    entryId,
    delta: {
      addNodes: addNodes.length,
      addEdges: addEdges.length,
      updateNodes: updateNodes.length,
      newLayout,
    },
    addNodes,
    addEdges,
    updateNodes,
  });
}

// ─── Helpers ────────────────────────────────────────────────────

function classifyLayout(
  intent: string,
  nodeCount: number,
  edgeCount: number,
): DiagramLayout {
  switch (intent) {
    case 'hierarchy': return 'tree';
    case 'process': return nodeCount <= 6 ? 'flow' : 'tree';
    case 'comparison': return 'radial';
    case 'evolution': return 'timeline';
    case 'cycle': return 'cycle';
    case 'layers': return 'pyramid';
    case 'web':
    default:
      if (edgeCount > nodeCount * 1.5) return 'constellation';
      if (nodeCount <= 5 && edgeCount === 0) return 'flow';
      return 'graph';
  }
}

function mapRelationType(
  graphType: string,
): DiagramEdge['type'] {
  const mapping: Record<string, DiagramEdge['type']> = {
    'explores': 'enables',
    'references': 'extends',
    'introduces': 'causes',
    'bridges-to': 'bridges',
    'cross-references': 'bridges',
    'defines': 'causes',
    'echoes': 'extends',
  };
  return mapping[graphType] ?? 'enables';
}
