/**
 * Tool Executor — resolves Gemini function calls against
 * the real data layer (IndexedDB + File Search + Knowledge Graph).
 *
 * When the tutor agent calls search_history(), lookup_concept(),
 * or get_connections(), this module executes the call and returns
 * the result as a function response to continue generation.
 *
 * Updated: also routes graph tools (traverse_graph, find_path,
 * discover_gaps, etc.) to the persistent knowledge graph.
 */
import { getOrCreateStore, searchNotebook, searchByType, searchAll } from './file-search';
import { buildGraph, getNeighbors, getDelta, serializeSubgraph } from './knowledge-graph';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import {
  executeGraphTool,
  extractGraphDeferred,
  type GraphDeferredAction,
} from './graph-tools';
import type { Subgraph } from './knowledge-graph';

/** Graph tool names that should be routed to the persistent graph. */
const GRAPH_TOOLS = new Set([
  'traverse_graph', 'find_path', 'discover_gaps',
  'get_concept_journey', 'read_attachment', 'suggest_bridge',
  'link_entities', 'get_entity_neighborhood',
]);

interface ToolContext {
  studentId: string;
  notebookId: string;
  sessionId?: string;
  graph: Subgraph | null;
}

/**
 * Execute a function call from the Gemini model.
 * Returns a string result to feed back as a function response.
 */
export async function executeTool(
  functionName: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  // Route persistent graph tools to the new graph executor
  if (GRAPH_TOOLS.has(functionName)) {
    return executeGraphTool(functionName, args, {
      studentId: ctx.studentId,
      notebookId: ctx.notebookId,
      sessionId: ctx.sessionId ?? '',
    });
  }

  switch (functionName) {
    case 'search_history':
      return executeSearch(args, ctx);
    case 'lookup_concept':
      return lookupConcept(String(args.concept ?? ''), ctx);
    case 'lookup_thinker':
      return lookupThinker(String(args.thinker ?? ''), ctx);
    case 'lookup_term':
      return lookupTerm(String(args.term ?? ''), ctx);
    case 'get_connections':
      return getConnections(String(args.entity ?? ''), Number(args.depth ?? 1), ctx);
    case 'get_recent_changes':
      return getRecentChanges(Number(args.since_minutes ?? 30), ctx);
    case 'create_annotation':
      return JSON.stringify({ status: 'queued', entry_id: args.entry_id, content: args.content });
    case 'add_to_lexicon':
      return JSON.stringify({ status: 'queued', term: args.term, definition: args.definition });
    default:
      return JSON.stringify({ error: `Unknown tool: ${functionName}` });
  }
}

/** Collect write-side tool calls for deferred execution. */
export interface DeferredAction {
  type: 'annotate' | 'add_lexicon';
  args: Record<string, unknown>;
}

export function extractDeferredActions(
  functionName: string,
  args: Record<string, unknown>,
  notebookId?: string,
): DeferredAction | GraphDeferredAction | null {
  if (functionName === 'create_annotation') {
    return { type: 'annotate', args };
  }
  if (functionName === 'add_to_lexicon') {
    return { type: 'add_lexicon', args };
  }
  // Route graph write tools
  const graphDeferred = extractGraphDeferred(
    functionName, args, notebookId ?? '',
  );
  if (graphDeferred) return graphDeferred;

  return null;
}

// ─── Tool implementations ────────────────────────────────────────────

async function executeSearch(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const query = String(args.query ?? '');
  const scope = String(args.scope ?? 'notebook');

  try {
    const store = await getOrCreateStore(ctx.studentId);

    if (scope === 'all') {
      const r = await searchAll(store, query);
      return r.text || '(no results)';
    }
    if (['sessions', 'lexicon', 'encounters', 'mastery'].includes(scope)) {
      const r = await searchByType(
        store, query,
        scope as 'session' | 'lexicon' | 'encounter' | 'mastery',
        ctx.notebookId,
      );
      return r.text || '(no results)';
    }

    const r = await searchNotebook(store, query, ctx.notebookId);
    return r.text || '(no results)';
  } catch {
    return '(search unavailable)';
  }
}

async function lookupConcept(
  concept: string, ctx: ToolContext,
): Promise<string> {
  const all = await getMasteryByNotebook(ctx.notebookId);
  const match = all.find((m) =>
    m.concept.toLowerCase() === concept.toLowerCase(),
  );
  if (!match) return `No mastery data for "${concept}".`;
  return JSON.stringify({
    concept: match.concept,
    level: match.level,
    percentage: match.percentage,
  });
}

async function lookupThinker(
  thinker: string, ctx: ToolContext,
): Promise<string> {
  const all = await getEncountersByNotebook(ctx.notebookId);
  const match = all.find((e) =>
    e.thinker.toLowerCase() === thinker.toLowerCase(),
  );
  if (!match) return `No encounter with "${thinker}" in this notebook.`;
  return JSON.stringify({
    thinker: match.thinker,
    tradition: match.tradition,
    coreIdea: match.coreIdea,
    status: match.status,
    date: match.date,
  });
}

async function lookupTerm(
  term: string, ctx: ToolContext,
): Promise<string> {
  const all = await getLexiconByNotebook(ctx.notebookId);
  const match = all.find((l) =>
    l.term.toLowerCase() === term.toLowerCase(),
  );
  if (!match) return `"${term}" not in student's vocabulary yet.`;
  return JSON.stringify({
    term: match.term,
    definition: match.definition,
    level: match.level,
    percentage: match.percentage,
    etymology: match.etymology,
    crossReferences: match.crossReferences,
  });
}

async function getConnections(
  entity: string, depth: number, ctx: ToolContext,
): Promise<string> {
  const graph = ctx.graph ?? await buildGraph(ctx.notebookId);

  // Find the node by label match
  const node = graph.nodes.find((n) =>
    n.label.toLowerCase().includes(entity.toLowerCase()),
  );
  if (!node) return `No entity matching "${entity}" in the knowledge graph.`;

  const sub = getNeighbors(graph, node.id, Math.min(depth, 3));
  return serializeSubgraph(sub);
}

async function getRecentChanges(
  sinceMinutes: number, ctx: ToolContext,
): Promise<string> {
  const graph = ctx.graph ?? await buildGraph(ctx.notebookId);
  const since = Date.now() - sinceMinutes * 60_000;
  const delta = getDelta(graph, since);

  if (delta.nodes.length === 0) {
    return `No changes in the last ${sinceMinutes} minutes.`;
  }

  return serializeSubgraph(delta);
}
