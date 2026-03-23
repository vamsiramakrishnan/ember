/**
 * Tool Implementations — data lookup and search tools.
 *
 * Contains executeSearch(), lookupConcept(), lookupThinker(),
 * lookupTerm(), getConnections(), and getRecentChanges().
 * Split from tool-executor.ts for the 150-line file-size discipline.
 */
import { getOrCreateStore, searchNotebook, searchByType, searchAll } from './file-search';
import { buildGraph, getNeighbors, getDelta, serializeSubgraph } from './knowledge-graph';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import type { ToolContext } from './tool-executor';

export async function executeSearch(
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
    // Map scope aliases to File Search document types
    const scopeMap: Record<string, string> = {
      sessions: 'session', lexicon: 'lexicon', encounters: 'encounter',
      mastery: 'mastery', files: 'uploaded-file', flashcards: 'flashcard',
      exercises: 'exercise', reading: 'reading-material',
    };
    if (scopeMap[scope]) {
      const r = await searchByType(store, query, scopeMap[scope], ctx.notebookId);
      return r.text || '(no results)';
    }

    const r = await searchNotebook(store, query, ctx.notebookId);
    return r.text || '(no results)';
  } catch {
    return '(search unavailable)';
  }
}

export async function lookupConcept(
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

export async function lookupThinker(
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

export async function lookupTerm(
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

export async function getConnections(
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

export async function getRecentChanges(
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
