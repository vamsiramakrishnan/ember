/**
 * GraphTools — agent tool declarations and executors for the
 * persistent knowledge graph.
 *
 * These tools give the AI tutor the ability to *explore* the
 * student's knowledge rather than just *see* a summary. The
 * difference: a summary is a photograph. Tools are a flashlight.
 *
 * Tool design principles:
 * 1. Read tools are cheap — the agent can call many in one turn
 * 2. Write tools are deferred — queued for post-response execution
 * 3. Graph tools return structured data — the agent decides how to use it
 * 4. Every tool response includes provenance (source entry IDs)
 *
 * New tools beyond the original agent-tools.ts:
 * - traverse_graph: BFS with typed edge filters
 * - find_path: shortest path between any two entities
 * - discover_gaps: find underdeveloped areas near strong ones
 * - read_attachment: summarize an uploaded file/image
 * - get_concept_journey: how understanding of X evolved over time
 * - suggest_bridge: find cross-notebook connections
 * - link_entities: create a new graph edge
 */
import {
  getOutgoing,
  getIncoming,
  traverse,
  findPath,
  getNeighborhood,
  createRelation,
} from '@/persistence/repositories/graph';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getBlobAsDataUrl, getBlobsByRef } from '@/persistence/repositories/blobs';
import type { RelationType, EntityKind } from '@/types/entity';

// ─── Tool declarations for Gemini ─────────────────────────

export const GRAPH_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'traverse_graph',
        description: 'Explore the knowledge graph outward from an entity. Returns all connected entities within N hops, filtered by relation types. Use to discover what concepts/thinkers/terms connect to a given idea.',
        parameters: {
          type: 'object',
          properties: {
            entity_id: { type: 'string', description: 'Starting entity ID.' },
            depth: { type: 'number', description: 'How many hops (1-3). Default 2.' },
            relation_types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by relation types: explores, references, introduces, bridges-to, cross-references, defines. Empty = all.',
            },
          },
          required: ['entity_id'],
        },
      },
      {
        name: 'find_path',
        description: 'Find the shortest connection path between two entities in the knowledge graph. Reveals hidden bridges — how a thinker connects to a concept through the student\'s own exploration history.',
        parameters: {
          type: 'object',
          properties: {
            from_id: { type: 'string', description: 'Source entity ID.' },
            to_id: { type: 'string', description: 'Target entity ID.' },
          },
          required: ['from_id', 'to_id'],
        },
      },
      {
        name: 'discover_gaps',
        description: 'Find learning gaps — concepts the student has encountered but not developed, thinkers met but not explored, questions asked but not resolved. Returns prioritized suggestions.',
        parameters: {
          type: 'object',
          properties: {
            focus: {
              type: 'string',
              enum: ['mastery', 'thinkers', 'curiosities', 'all'],
              description: 'What kind of gaps to look for. Default "all".',
            },
          },
        },
      },
      {
        name: 'get_concept_journey',
        description: 'Trace how the student\'s understanding of a concept evolved over time. Returns a timeline of entries, mastery changes, and related discoveries.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'The concept name.' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'read_attachment',
        description: 'Read and summarize an uploaded file, image, or PDF that the student has attached. Returns the content or a description.',
        parameters: {
          type: 'object',
          properties: {
            entry_id: { type: 'string', description: 'The entry ID that contains the attachment.' },
          },
          required: ['entry_id'],
        },
      },
      {
        name: 'suggest_bridge',
        description: 'Find surprising connections between concepts across different notebooks. Reveals that music theory connects to evolution, or that Kepler\'s harmonics bridges to linguistics.',
        parameters: {
          type: 'object',
          properties: {
            concept: { type: 'string', description: 'Starting concept to find bridges from.' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'link_entities',
        description: 'Create a new connection in the knowledge graph. Use when you notice a relationship the student hasn\'t made explicit yet.',
        parameters: {
          type: 'object',
          properties: {
            from_id: { type: 'string', description: 'Source entity.' },
            to_id: { type: 'string', description: 'Target entity.' },
            relation_type: {
              type: 'string',
              enum: ['references', 'bridges-to', 'cross-references', 'explores'],
              description: 'Type of relationship.',
            },
            reason: { type: 'string', description: 'Why this connection exists (shown to student on hover).' },
          },
          required: ['from_id', 'to_id', 'relation_type'],
        },
      },
      {
        name: 'get_entity_neighborhood',
        description: 'Get everything directly connected to an entity — all incoming and outgoing relations with their types. Like looking at one node in the constellation and seeing every thread that connects to it.',
        parameters: {
          type: 'object',
          properties: {
            entity_id: { type: 'string', description: 'The entity to inspect.' },
          },
          required: ['entity_id'],
        },
      },
    ],
  },
];

// ─── Tool executor ────────────────────────────────────────

interface GraphToolContext {
  studentId: string;
  notebookId: string;
  sessionId: string;
}

export async function executeGraphTool(
  name: string,
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  switch (name) {
    case 'traverse_graph':
      return execTraverse(args, ctx);
    case 'find_path':
      return execFindPath(args);
    case 'discover_gaps':
      return execDiscoverGaps(args, ctx);
    case 'get_concept_journey':
      return execConceptJourney(args, ctx);
    case 'read_attachment':
      return execReadAttachment(args);
    case 'suggest_bridge':
      return execSuggestBridge(args, ctx);
    case 'link_entities':
      return execLinkEntities(args, ctx);
    case 'get_entity_neighborhood':
      return execNeighborhood(args);
    default:
      return JSON.stringify({ error: `Unknown graph tool: ${name}` });
  }
}

// ─── Deferred actions from graph tools ────────────────────

export interface GraphDeferredAction {
  type: 'link_entities';
  args: Record<string, unknown>;
  notebookId: string;
}

export function extractGraphDeferred(
  name: string,
  args: Record<string, unknown>,
  notebookId: string,
): GraphDeferredAction | null {
  if (name === 'link_entities') {
    return { type: 'link_entities', args, notebookId };
  }
  return null;
}

export async function executeGraphDeferred(
  action: GraphDeferredAction,
): Promise<void> {
  if (action.type === 'link_entities') {
    const a = action.args;
    await createRelation({
      notebookId: action.notebookId,
      from: String(a.from_id),
      fromKind: 'concept' as EntityKind,
      to: String(a.to_id),
      toKind: 'concept' as EntityKind,
      type: String(a.relation_type) as RelationType,
      meta: String(a.reason ?? ''),
      weight: 0.7,
    });
  }
}

// ─── Tool implementations ─────────────────────────────────

async function execTraverse(
  args: Record<string, unknown>,
  _ctx: GraphToolContext,
): Promise<string> {
  const entityId = String(args.entity_id ?? '');
  const depth = Math.min(Number(args.depth ?? 2), 3);
  const types = Array.isArray(args.relation_types)
    ? args.relation_types.map(String) as RelationType[]
    : [];

  const reachable = types.length > 0
    ? await traverse(entityId, types, depth)
    : await traverse(entityId, [
        'explores', 'references', 'introduces',
        'bridges-to', 'cross-references', 'defines',
      ], depth);

  const result: Record<string, string[]> = {};
  for (const [d, ids] of reachable) {
    result[`depth_${d}`] = ids;
  }

  return JSON.stringify({ start: entityId, depth, reachable: result });
}

async function execFindPath(
  args: Record<string, unknown>,
): Promise<string> {
  const fromId = String(args.from_id ?? '');
  const toId = String(args.to_id ?? '');
  const path = await findPath(fromId, toId);

  if (path.length === 0) {
    return JSON.stringify({ connected: false, message: 'No path found between these entities.' });
  }

  return JSON.stringify({ connected: true, path, hops: path.length - 1 });
}

async function execDiscoverGaps(
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  const focus = String(args.focus ?? 'all');
  const gaps: Record<string, unknown[]> = {};

  if (focus === 'all' || focus === 'mastery') {
    const mastery = await getMasteryByNotebook(ctx.notebookId);
    const exploring = mastery
      .filter((m) => m.level === 'exploring' && m.percentage < 25)
      .map((m) => ({ concept: m.concept, percentage: m.percentage }));
    const nearStrong = mastery
      .filter((m) => m.level === 'developing' && m.percentage > 60)
      .map((m) => ({ concept: m.concept, percentage: m.percentage, readyToDeepen: true }));
    gaps.underdeveloped = exploring;
    gaps.readyToDeepen = nearStrong;
  }

  if (focus === 'all' || focus === 'thinkers') {
    const encounters = await getEncountersByNotebook(ctx.notebookId);
    const dormant = encounters
      .filter((e) => e.status === 'dormant' || e.status === 'pending')
      .map((e) => ({ thinker: e.thinker, coreIdea: e.coreIdea, status: e.status }));
    gaps.dormantThinkers = dormant;
  }

  if (focus === 'all' || focus === 'curiosities') {
    const curiosities = await getCuriositiesByNotebook(ctx.notebookId);
    gaps.openQuestions = curiosities.map((c) => ({ question: c.question }));
  }

  return JSON.stringify(gaps);
}

async function execConceptJourney(
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  const conceptName = String(args.concept ?? '').toLowerCase();

  const mastery = await getMasteryByNotebook(ctx.notebookId);
  const match = mastery.find((m) =>
    m.concept.toLowerCase() === conceptName,
  );

  if (!match) {
    return JSON.stringify({ found: false, message: `No mastery data for "${args.concept}".` });
  }

  // Find all entries that reference this concept via graph
  const incoming = await getIncoming(match.id);
  const outgoing = await getOutgoing(match.id);

  const relatedEntryIds = [
    ...incoming.filter((r) => r.fromKind === 'entry').map((r) => r.from),
    ...outgoing.filter((r) => r.toKind === 'entry').map((r) => r.to),
  ];

  return JSON.stringify({
    found: true,
    concept: match.concept,
    currentLevel: match.level,
    currentPercentage: match.percentage,
    firstSeen: new Date(match.createdAt).toISOString(),
    lastUpdated: new Date(match.updatedAt).toISOString(),
    relatedEntries: relatedEntryIds.length,
    connections: {
      incoming: incoming.length,
      outgoing: outgoing.length,
    },
  });
}

async function execReadAttachment(
  args: Record<string, unknown>,
): Promise<string> {
  const entryId = String(args.entry_id ?? '');
  const blobs = await getBlobsByRef(entryId);

  if (blobs.length === 0) {
    return JSON.stringify({ found: false, message: 'No attachment found for this entry.' });
  }

  const results = [];
  for (const blob of blobs) {
    const info: Record<string, unknown> = {
      hash: blob.hash,
      mimeType: blob.mimeType,
      size: blob.size,
    };

    // For images, include the data URL so the multimodal model can see it
    if (blob.mimeType.startsWith('image/')) {
      const dataUrl = await getBlobAsDataUrl(blob.hash);
      info.dataUrl = dataUrl;
      info.description = 'Image attached by student. Analyze visually.';
    } else if (blob.mimeType === 'application/pdf') {
      info.description = 'PDF document. Content extraction available via semantic search.';
    } else {
      info.description = `File: ${blob.mimeType}, ${blob.size} bytes.`;
    }

    results.push(info);
  }

  return JSON.stringify({ found: true, attachments: results });
}

async function execSuggestBridge(
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  const concept = String(args.concept ?? '').toLowerCase();

  // Find the concept entity
  const mastery = await getMasteryByNotebook(ctx.notebookId);
  const match = mastery.find((m) =>
    m.concept.toLowerCase() === concept,
  );

  if (!match) {
    return JSON.stringify({
      found: false,
      message: `Concept "${args.concept}" not in knowledge graph.`,
    });
  }

  // Find what this concept connects to
  const neighborhood = await getNeighborhood(match.id);
  const connectedKinds = neighborhood.map((n) => n.kind);

  // Suggest bridges based on what's NOT yet connected
  const allThinkers = await getEncountersByNotebook(ctx.notebookId);
  const connectedThinkerIds = new Set(
    neighborhood.filter((n) => n.kind === 'thinker').map((n) => n.entityId),
  );
  const unconnectedThinkers = allThinkers.filter(
    (t) => !connectedThinkerIds.has(t.id),
  );

  return JSON.stringify({
    concept: match.concept,
    currentConnections: neighborhood.length,
    connectedKinds: [...new Set(connectedKinds)],
    potentialBridges: unconnectedThinkers.slice(0, 3).map((t) => ({
      thinker: t.thinker,
      coreIdea: t.coreIdea,
      suggestion: `${t.thinker}'s work on "${t.coreIdea}" may connect to ${match.concept}.`,
    })),
  });
}

async function execLinkEntities(
  args: Record<string, unknown>,
  _ctx: GraphToolContext,
): Promise<string> {
  // Deferred — return acknowledgment, actual creation happens post-response
  return JSON.stringify({
    status: 'queued',
    from: args.from_id,
    to: args.to_id,
    type: args.relation_type,
    reason: args.reason,
  });
}

async function execNeighborhood(
  args: Record<string, unknown>,
): Promise<string> {
  const entityId = String(args.entity_id ?? '');
  const neighbors = await getNeighborhood(entityId);

  if (neighbors.length === 0) {
    return JSON.stringify({ entity: entityId, connections: 0, message: 'No connections found.' });
  }

  return JSON.stringify({
    entity: entityId,
    connections: neighbors.length,
    neighbors: neighbors.map((n) => ({
      id: n.entityId,
      kind: n.kind,
      relation: n.relation,
      direction: n.direction,
    })),
  });
}
