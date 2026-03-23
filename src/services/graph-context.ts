/**
 * GraphContext — builds rich, graph-aware context for the tutor agent.
 *
 * This is Layer 6 of the context assembler: Knowledge Graph Context.
 * Instead of just serializing mastery data, it traverses the graph
 * to find structurally relevant context that the tutor can use to
 * make connections the student hasn't seen yet.
 *
 * How it works:
 * 1. Extract concepts from the student's latest entry (text analysis)
 * 2. Find those concepts in the knowledge graph
 * 3. Traverse outward to find related entities
 * 4. Compute learning gaps near those concepts
 * 5. Check for open threads that connect
 * 6. Serialize into a compact, tagged context block
 *
 * The tutor sees this as structured context, not as tools to call.
 * Tools are for exploration; context is for awareness.
 */
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getByNotebook, getNeighborhood } from '@/persistence/repositories/graph';
import { findLearningGaps, trackThreads } from '@/state/learning-intelligence';
import type { MasteryRecord } from '@/persistence/records';

export interface GraphContextLayer {
  /** Concepts directly relevant to the student's latest entry. */
  activeConcepts: Array<{
    concept: string;
    level: string;
    percentage: number;
    connections: number;
  }>;
  /** Learning gaps near the active concepts. */
  nearbyGaps: Array<{
    concept: string;
    percentage: number;
    reason: string;
  }>;
  /** Open questions that connect to the current topic. */
  openThreads: string[];
  /** Thinkers whose ideas are relevant but not yet bridged. */
  unbridgedThinkers: Array<{
    name: string;
    coreIdea: string;
  }>;
  /** Compact serialized form for injection into the context window. */
  serialized: string;
}

/**
 * Build graph context for the tutor based on the student's latest text.
 * Returns null if no meaningful graph context can be assembled.
 */
export async function buildGraphContext(
  notebookId: string,
  studentText: string,
): Promise<GraphContextLayer | null> {
  // Extract potential concept references from the student's text
  const mentionedTerms = extractMentions(studentText);
  if (mentionedTerms.length === 0) return null;

  const [mastery, encounters, gaps, threads] = await Promise.all([
    getMasteryByNotebook(notebookId),
    getEncountersByNotebook(notebookId),
    findLearningGaps(notebookId),
    trackThreads(notebookId),
  ]);

  // Find concepts that match the student's text
  const activeConcepts = findMatchingConcepts(mentionedTerms, mastery);
  if (activeConcepts.length === 0) return null;

  // Get connection counts for active concepts
  const relations = await getByNotebook(notebookId);
  const connectionCounts = new Map<string, number>();
  for (const r of relations) {
    connectionCounts.set(r.from, (connectionCounts.get(r.from) ?? 0) + 1);
    connectionCounts.set(r.to, (connectionCounts.get(r.to) ?? 0) + 1);
  }

  const enrichedConcepts = activeConcepts.map((m) => ({
    concept: m.concept,
    level: m.level,
    percentage: m.percentage,
    connections: connectionCounts.get(m.id) ?? 0,
  }));

  // Find gaps near active concepts
  const activeConceptIds = new Set(activeConcepts.map((m) => m.id));
  const nearbyGaps = gaps
    .filter((g) => {
      // Is this gap's concept connected to any active concept?
      return relations.some(
        (r) => (r.from === g.conceptId && activeConceptIds.has(r.to)) ||
               (r.to === g.conceptId && activeConceptIds.has(r.from)),
      );
    })
    .slice(0, 3)
    .map((g) => ({
      concept: g.concept,
      percentage: g.currentPercentage,
      reason: g.reason,
    }));

  // Find open threads that mention active concepts
  const openThreads = threads
    .filter((t) => t.status === 'open')
    .filter((t) => mentionedTerms.some((term) =>
      t.question.toLowerCase().includes(term.toLowerCase()),
    ))
    .map((t) => t.question)
    .slice(0, 3);

  // Find thinkers not yet connected to active concepts
  const connectedThinkerIds = new Set<string>();
  for (const c of activeConcepts) {
    const neighborhood = await getNeighborhood(c.id);
    for (const n of neighborhood) {
      if (n.kind === 'thinker') connectedThinkerIds.add(n.entityId);
    }
  }
  const unbridgedThinkers = encounters
    .filter((e) => !connectedThinkerIds.has(e.id) && e.status === 'active')
    .slice(0, 2)
    .map((e) => ({ name: e.thinker, coreIdea: e.coreIdea }));

  const layer: GraphContextLayer = {
    activeConcepts: enrichedConcepts,
    nearbyGaps,
    openThreads,
    unbridgedThinkers,
    serialized: '',
  };

  layer.serialized = serializeGraphContext(layer);
  return layer;
}

// ─── Serialization ────────────────────────────────────────

function serializeGraphContext(ctx: GraphContextLayer): string {
  const lines: string[] = ['[KNOWLEDGE GRAPH — active context]'];

  if (ctx.activeConcepts.length > 0) {
    lines.push('Active concepts:');
    for (const c of ctx.activeConcepts) {
      lines.push(`  ${c.concept}: ${c.level} (${c.percentage}%) — ${c.connections} connections`);
    }
  }

  if (ctx.nearbyGaps.length > 0) {
    lines.push('Nearby learning gaps (opportunities to deepen):');
    for (const g of ctx.nearbyGaps) {
      lines.push(`  ${g.concept} (${g.percentage}%): ${g.reason}`);
    }
  }

  if (ctx.openThreads.length > 0) {
    lines.push('Open questions that connect:');
    for (const q of ctx.openThreads) {
      lines.push(`  "${q}"`);
    }
  }

  if (ctx.unbridgedThinkers.length > 0) {
    lines.push('Thinkers not yet bridged to these concepts:');
    for (const t of ctx.unbridgedThinkers) {
      lines.push(`  ${t.name}: "${t.coreIdea}"`);
    }
  }

  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────

/** Extract potential concept/thinker/term references from text. */
function extractMentions(text: string): string[] {
  const mentions: string[] = [];

  // Capitalized phrases (concept names, thinker names)
  const caps = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) ?? [];
  mentions.push(...caps);

  // Quoted terms
  const quoted = text.match(/"([^"]{3,40})"/g) ?? [];
  mentions.push(...quoted.map((q) => q.slice(1, -1)));

  // Significant words (>6 chars, likely domain terms)
  const words = text.split(/\s+/).filter((w) => w.length > 6 && /^[a-z]/i.test(w));
  mentions.push(...words);

  return [...new Set(mentions)];
}

/** Find mastery records that match any of the mentioned terms. */
function findMatchingConcepts(
  mentions: string[],
  mastery: MasteryRecord[],
): MasteryRecord[] {
  const lowerMentions = mentions.map((m) => m.toLowerCase());

  return mastery.filter((m) => {
    const lowerConcept = m.concept.toLowerCase();
    return lowerMentions.some((mention) =>
      lowerConcept.includes(mention) || mention.includes(lowerConcept),
    );
  });
}
