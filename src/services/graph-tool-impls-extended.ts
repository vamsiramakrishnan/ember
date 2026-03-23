/**
 * GraphToolImplsExtended — implementation functions for attachment reading,
 * bridge suggestion, entity linking, and neighborhood inspection.
 *
 * These are the remaining graph tool implementations, split from
 * graph-tool-impls.ts to maintain the 150-line file discipline.
 */
import {
  getNeighborhood,
} from '@/persistence/repositories/graph';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getBlobAsDataUrl, getBlobsByRef } from '@/persistence/repositories/blobs';
import type { GraphToolContext } from '@/services/graph-tool-executor';

export async function execReadAttachment(
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

export async function execSuggestBridge(
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  const concept = String(args.concept ?? '').toLowerCase();

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

  const neighborhood = await getNeighborhood(match.id);
  const connectedKinds = neighborhood.map((n) => n.kind);

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

export async function execLinkEntities(
  args: Record<string, unknown>,
  _ctx: GraphToolContext,
): Promise<string> {
  return JSON.stringify({
    status: 'queued',
    from: args.from_id,
    to: args.to_id,
    type: args.relation_type,
    reason: args.reason,
  });
}

export async function execNeighborhood(
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
