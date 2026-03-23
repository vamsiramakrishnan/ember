/**
 * Command Context Resolver — shared context builder for slash commands
 * and DAG nodes. Closes the gap between the rich orchestrator pipeline
 * and the previously context-starved command paths.
 *
 * Three tiers of context, chosen per command:
 *
 * Tier 0 — Resolve only (zero async, ~0ms)
 *   Resolves @mentions and vague references ("this", "that") into
 *   concrete text using spatial context. Every command gets this.
 *
 * Tier 1 — Lightweight enrichment (~50ms, cached reads)
 *   Adds: working memory, session state, mastery snapshot.
 *   For: /draw, /visualize, /explain, /define, /summarize
 *
 * Tier 2 — Graph-aware enrichment (~200ms, async)
 *   Adds: knowledge graph context (active concepts, gaps, threads,
 *   unbridged thinkers). For: /research, /teach, /flashcards,
 *   /exercise, /quiz, /podcast
 *
 * See: context-formatter.ts for how the resolved context is shaped
 * into prompt-ready text (narrative, bulleted, structured).
 */
import { buildGraphContext, type GraphContextLayer } from './graph-context';
import { getWorkingMemory } from './working-memory';
import { getSessionState } from '@/state';
import { buildSpatialContext } from './spatial-context';
import { micro } from './agents/config';
import { askAgent } from './run-agent';
import { formatContext, type ContextFormat, type FormattableContext } from './context-formatter';
import type { LiveEntry } from '@/types/entries';

// ─── Types ──────────────────────────────────────────────────

export type ContextTier = 0 | 1 | 2;

export interface CommandContext {
  /** The query with @mentions stripped and vague refs resolved. */
  resolvedQuery: string;
  /** Formatted context string ready for prompt injection. */
  formatted: string;
  /** Raw graph context layer (for callers that need structured access). */
  graphLayer: GraphContextLayer | null;
  /** The tier that was actually resolved. */
  tier: ContextTier;
}

/** Which format each command type prefers. */
const COMMAND_FORMATS: Record<string, ContextFormat> = {
  draw: 'narrative',
  podcast: 'narrative',
  visualize: 'structured',
  timeline: 'structured',
  connect: 'structured',
  research: 'structured',
  explain: 'structured',
  define: 'structured',
  summarize: 'structured',
  quiz: 'bulleted',
  teach: 'bulleted',
  flashcards: 'bulleted',
  exercise: 'bulleted',
};

// ─── Tier 0: Reference Resolution ───────────────────────────

/** Does the query need LLM-based resolution? */
function needsResolution(query: string): boolean {
  if (/@\[/.test(query)) return true;
  return /\b(this|that|these|those|it|the above|the concept|the idea)\b/i.test(query);
}

/** Strip @mention syntax: @[Kepler](thinker:kepler-1) → Kepler */
function stripMentions(query: string): string {
  return query.replace(/@\[([^\]]+)\]\([^)]*\)/g, '$1');
}

const RESOLVER = micro(
  `You resolve ambiguous references in a student's slash command.

Given the student's command and their recent notebook context, rewrite the
command's argument with all references resolved into concrete terms.
- @[Name](type:id) → use the plain name
- "this", "that", "the above" → replace with the actual concept from context
- Keep the rewrite concise (1-2 sentences max)
- Output ONLY the resolved text. No preamble.`,
);

async function resolveQuery(
  rawQuery: string,
  entries: LiveEntry[],
): Promise<string> {
  if (!needsResolution(rawQuery)) return stripMentions(rawQuery);

  const spatial = buildSpatialContext(entries, [], null);
  if (!spatial.prompt) return stripMentions(rawQuery);

  try {
    const resolved = await askAgent(RESOLVER, [
      `Notebook context:\n${spatial.prompt}`,
      `\nStudent's command argument: ${rawQuery}`,
    ].join(''));
    const trimmed = resolved.trim();
    if (trimmed) return trimmed;
  } catch {
    // Fall through
  }
  return stripMentions(rawQuery);
}

// ─── Tier 1: Lightweight Enrichment ─────────────────────────

function buildTier1Context(
  notebookId: string | undefined,
): FormattableContext {
  const session = getSessionState();
  const wm = notebookId ? getWorkingMemory(notebookId) : null;

  return {
    activeConcepts: session.activeConcepts.map((c) => ({
      concept: c.term,
      level: 'active',
      percentage: 0,
      connections: 0,
    })),
    nearbyGaps: [],
    openThreads: [],
    unbridgedThinkers: [],
    sessionSummary: wm?.summary ?? undefined,
    mastery: session.masterySnapshot.map((m) => ({
      concept: m.concept,
      level: m.level,
      percentage: m.percentage,
    })),
  };
}

// ─── Tier 2: Graph-Aware Enrichment ─────────────────────────

async function buildTier2Context(
  resolvedQuery: string,
  notebookId: string | undefined,
): Promise<{ formattable: FormattableContext; graphLayer: GraphContextLayer | null }> {
  const tier1 = buildTier1Context(notebookId);

  if (!notebookId) return { formattable: tier1, graphLayer: null };

  try {
    const graphLayer = await buildGraphContext(notebookId, resolvedQuery);
    if (!graphLayer) return { formattable: tier1, graphLayer: null };

    return {
      formattable: {
        ...tier1,
        activeConcepts: graphLayer.activeConcepts,
        nearbyGaps: graphLayer.nearbyGaps,
        openThreads: graphLayer.openThreads,
        unbridgedThinkers: graphLayer.unbridgedThinkers,
      },
      graphLayer,
    };
  } catch {
    return { formattable: tier1, graphLayer: null };
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Resolve context for a slash command or DAG node.
 *
 * @param rawQuery — the user's text after the /command
 * @param entries — current session entries (for spatial context)
 * @param tier — how much context to gather (0, 1, or 2)
 * @param commandId — which command, for format selection
 * @param notebookId — current notebook (for graph + working memory)
 */
export async function resolveCommandContext(
  rawQuery: string,
  entries: LiveEntry[],
  tier: ContextTier,
  commandId: string,
  notebookId?: string,
): Promise<CommandContext> {
  // Tier 0: always resolve the query
  const resolvedQuery = await resolveQuery(rawQuery, entries);

  if (tier === 0) {
    return { resolvedQuery, formatted: '', graphLayer: null, tier: 0 };
  }

  const format = COMMAND_FORMATS[commandId] ?? 'structured';

  // Tier 1: cached reads only
  if (tier === 1) {
    const formattable = buildTier1Context(notebookId);
    return {
      resolvedQuery,
      formatted: formatContext(formattable, format),
      graphLayer: null,
      tier: 1,
    };
  }

  // Tier 2: async graph context
  const { formattable, graphLayer } = await buildTier2Context(
    resolvedQuery, notebookId,
  );
  return {
    resolvedQuery,
    formatted: formatContext(formattable, format),
    graphLayer,
    tier: 2,
  };
}
