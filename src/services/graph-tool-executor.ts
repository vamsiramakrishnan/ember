/**
 * GraphToolExecutor — routes tool calls to their implementations
 * and manages deferred graph mutations.
 *
 * Read tools execute immediately and return results to the AI.
 * Write tools (link_entities) are deferred for post-response execution.
 *
 * Uses structured ToolResult envelopes and retries transient errors once.
 */
import { createRelation } from '@/persistence/repositories/graph';
import type { RelationType, EntityKind } from '@/types/entity';
import {
  execTraverse,
  execFindPath,
  execDiscoverGaps,
  execConceptJourney,
} from '@/services/graph-tool-impls';
import {
  execReadAttachment,
  execSuggestBridge,
  execLinkEntities,
  execNeighborhood,
} from '@/services/graph-tool-impls-extended';
import { toolError } from './tool-result';
import { withRetry } from './retry';

// ─── Context passed to tool implementations ──────────────

export interface GraphToolContext {
  studentId: string;
  notebookId: string;
  sessionId: string;
}

// ─── Tool executor (with single retry for transient errors) ──

export async function executeGraphTool(
  name: string,
  args: Record<string, unknown>,
  ctx: GraphToolContext,
): Promise<string> {
  return withRetry(name, () => executeGraphToolInner(name, args, ctx));
}

/** Inner dispatch — no retry logic, just routing. */
async function executeGraphToolInner(
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
      return toolError(name, `Unknown graph tool: ${name}`);
  }
}

// ─── Deferred actions from graph tools ───────────────────

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
