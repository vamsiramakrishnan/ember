/**
 * GraphToolImpls — implementation functions for graph traversal,
 * pathfinding, gap discovery, and concept journey tools.
 *
 * Each function accepts raw tool args and returns a JSON string result.
 * These are the "read" tools that explore the student's knowledge graph.
 */
import {
  getOutgoing,
  getIncoming,
  traverse,
  findPath,
} from '@/persistence/repositories/graph';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import type { RelationType } from '@/types/entity';
import type { GraphToolContext } from '@/services/graph-tool-executor';

export async function execTraverse(
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

export async function execFindPath(
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

export async function execDiscoverGaps(
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

export async function execConceptJourney(
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
