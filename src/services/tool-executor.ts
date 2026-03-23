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
import {
  executeGraphTool,
  extractGraphDeferred,
  type GraphDeferredAction,
} from './graph-tools';
import {
  executeSearch,
  lookupConcept,
  lookupThinker,
  lookupTerm,
  getConnections,
  getRecentChanges,
} from './tool-impls';
import { getEntryContent, readFileContent } from './tool-impls-content';
import type { Subgraph } from './knowledge-graph';

/** Graph tool names that should be routed to the persistent graph. */
const GRAPH_TOOLS = new Set([
  'traverse_graph', 'find_path', 'discover_gaps',
  'get_concept_journey', 'read_attachment', 'suggest_bridge',
  'link_entities', 'get_entity_neighborhood',
]);

export interface ToolContext {
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
    case 'get_entry_content':
      return getEntryContent(String(args.entry_id ?? ''));
    case 'read_file_content':
      return readFileContent(String(args.entry_id ?? ''));
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
