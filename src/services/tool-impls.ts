/**
 * Tool Implementations — data lookup and search tools.
 *
 * Contains executeSearch(), lookupConcept(), lookupThinker(),
 * lookupTerm(), getConnections(), and getRecentChanges().
 * Split from tool-executor.ts for the 150-line file-size discipline.
 *
 * All functions return structured ToolResult envelopes via the
 * toolOk / toolNotFound / toolError helpers.
 */
import { getOrCreateStore, searchNotebook, searchByType, searchAll } from './file-search';
import { buildGraph, getNeighbors, getDelta, serializeSubgraph } from './knowledge-graph';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { toolOk, toolNotFound, toolError } from './tool-result';
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
      return r.text ? toolOk(r.text) : toolNotFound(query);
    }
    const scopeMap: Record<string, string> = {
      sessions: 'session', lexicon: 'lexicon', encounters: 'encounter',
      mastery: 'mastery', files: 'uploaded-file', flashcards: 'flashcard',
      exercises: 'exercise', reading: 'reading-material',
    };
    if (scopeMap[scope]) {
      const r = await searchByType(store, query, scopeMap[scope], ctx.notebookId);
      return r.text ? toolOk(r.text) : toolNotFound(query);
    }

    const r = await searchNotebook(store, query, ctx.notebookId);
    return r.text ? toolOk(r.text) : toolNotFound(query);
  } catch (err) {
    return toolError('search_history', String(err));
  }
}

export async function lookupConcept(
  concept: string, ctx: ToolContext,
): Promise<string> {
  try {
    const all = await getMasteryByNotebook(ctx.notebookId);
    const match = all.find((m) =>
      m.concept.toLowerCase() === concept.toLowerCase(),
    );
    if (!match) return toolNotFound(concept);
    return toolOk(JSON.stringify({
      concept: match.concept,
      level: match.level,
      percentage: match.percentage,
    }));
  } catch (err) {
    return toolError('lookup_concept', String(err));
  }
}

export async function lookupThinker(
  thinker: string, ctx: ToolContext,
): Promise<string> {
  try {
    const all = await getEncountersByNotebook(ctx.notebookId);
    const match = all.find((e) =>
      e.thinker.toLowerCase() === thinker.toLowerCase(),
    );
    if (!match) return toolNotFound(thinker);
    return toolOk(JSON.stringify({
      thinker: match.thinker,
      tradition: match.tradition,
      coreIdea: match.coreIdea,
      status: match.status,
      date: match.date,
    }));
  } catch (err) {
    return toolError('lookup_thinker', String(err));
  }
}

export async function lookupTerm(
  term: string, ctx: ToolContext,
): Promise<string> {
  try {
    const all = await getLexiconByNotebook(ctx.notebookId);
    const match = all.find((l) =>
      l.term.toLowerCase() === term.toLowerCase(),
    );
    if (!match) return toolNotFound(term);
    return toolOk(JSON.stringify({
      term: match.term,
      definition: match.definition,
      level: match.level,
      percentage: match.percentage,
      etymology: match.etymology,
      crossReferences: match.crossReferences,
    }));
  } catch (err) {
    return toolError('lookup_term', String(err));
  }
}

export async function getConnections(
  entity: string, depth: number, ctx: ToolContext,
): Promise<string> {
  try {
    const graph = ctx.graph ?? await buildGraph(ctx.notebookId);
    const node = graph.nodes.find((n) =>
      n.label.toLowerCase().includes(entity.toLowerCase()),
    );
    if (!node) return toolNotFound(entity);

    const sub = getNeighbors(graph, node.id, Math.min(depth, 3));
    if (sub.nodes.length <= 1) return toolNotFound(entity);
    return toolOk(serializeSubgraph(sub));
  } catch (err) {
    return toolError('get_connections', String(err));
  }
}

export async function getRecentChanges(
  sinceMinutes: number, ctx: ToolContext,
): Promise<string> {
  try {
    const graph = ctx.graph ?? await buildGraph(ctx.notebookId);
    const since = Date.now() - sinceMinutes * 60_000;
    const delta = getDelta(graph, since);

    if (delta.nodes.length === 0) {
      return toolNotFound(`changes in the last ${sinceMinutes} minutes`);
    }

    return toolOk(serializeSubgraph(delta));
  } catch (err) {
    return toolError('get_recent_changes', String(err));
  }
}
