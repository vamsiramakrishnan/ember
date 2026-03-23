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
import { getEntry } from '@/persistence/repositories/entries';
import { getBlob } from '@/persistence/repositories/blobs';
import { extractContent } from './entry-utils';
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

/** Fetch full structured content of any entry by ID. */
async function getEntryContent(entryId: string): Promise<string> {
  if (!entryId) return '(no entry_id provided)';

  const record = await getEntry(entryId);
  if (!record) return `Entry "${entryId}" not found.`;

  const entry = record.entry;

  // Return rich structured content based on type
  switch (entry.type) {
    case 'reading-material':
      return JSON.stringify({
        type: 'reading-material',
        title: entry.title,
        subtitle: entry.subtitle,
        slideCount: entry.slides.length,
        slides: entry.slides.map((s, i) => ({
          index: i + 1, heading: s.heading, layout: s.layout,
          body: s.body.slice(0, 300), accent: s.accent,
          ...(s.timeline ? { timeline: s.timeline } : {}),
          ...(s.tableData ? { tableData: s.tableData } : {}),
          ...(s.diagramItems ? { diagramItems: s.diagramItems } : {}),
        })),
      });
    case 'flashcard-deck':
      return JSON.stringify({
        type: 'flashcard-deck',
        title: entry.title,
        cardCount: entry.cards.length,
        cards: entry.cards.map((c, i) => ({
          index: i + 1, front: c.front, back: c.back, concept: c.concept,
        })),
      });
    case 'exercise-set':
      return JSON.stringify({
        type: 'exercise-set',
        title: entry.title,
        difficulty: entry.difficulty,
        exercises: entry.exercises.map((e, i) => ({
          index: i + 1, prompt: e.prompt, format: e.format, concept: e.concept,
          hintCount: e.hints?.length ?? 0,
        })),
      });
    case 'code-cell':
      return JSON.stringify({
        type: 'code-cell', language: entry.language,
        source: entry.source, result: entry.result,
      });
    case 'concept-diagram':
      return JSON.stringify({
        type: 'concept-diagram', title: entry.title,
        items: entry.items, edges: entry.edges,
      });
    default: {
      const content = extractContent(entry);
      return content ?? JSON.stringify({ type: entry.type, note: 'No drillable content.' });
    }
  }
}

/** Read text content from an uploaded file's blob storage. */
async function readFileContent(entryId: string): Promise<string> {
  if (!entryId) return '(no entry_id provided)';

  const record = await getEntry(entryId);
  if (!record) return `Entry "${entryId}" not found.`;

  const entry = record.entry;

  // Code cells: return full source directly
  if (entry.type === 'code-cell') {
    return entry.source;
  }

  // File uploads and documents: try to read from blob storage
  if (entry.type === 'file-upload' || entry.type === 'document') {
    const hash = entry.file.blobHash;
    const mime = entry.file.mimeType;

    // Only read text-based files
    if (mime.startsWith('text/') || mime === 'application/json' ||
        mime === 'text/csv' || mime.includes('javascript') || mime.includes('xml')) {
      const blob = await getBlob(hash);
      if (!blob) return '(file data not found in storage)';
      try {
        const text = await blob.data.text();
        return text.slice(0, 2000);
      } catch {
        return '(could not read file as text)';
      }
    }

    // Binary files: suggest alternative tools
    if (mime.startsWith('image/')) {
      return `This is an image file (${mime}). Use read_attachment(entry_id="${entryId}") to see it visually.`;
    }
    if (mime === 'application/pdf') {
      return `This is a PDF. Use search_history(query="...", scope="notebook") to search its content — it was indexed when uploaded.`;
    }
    return `Binary file (${mime}, ${entry.file.size} bytes). Cannot read as text.`;
  }

  return '(not a file entry)';
}
