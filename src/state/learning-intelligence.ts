/**
 * LearningIntelligence — the analytical engine that finds meaning
 * in the knowledge graph.
 *
 * This is the layer that answers: "What should happen next?"
 *
 * It computes:
 * - Learning gaps: what's shallow relative to what's deep
 * - Mastery trajectories: is understanding growing or stalling
 * - Exploration suggestions: what to explore based on graph topology
 * - Thread tracking: which questions are resolved, which are open
 * - Concept clusters: which ideas naturally group together
 * - Bridge opportunities: surprising connections across domains
 *
 * All functions are pure computations over persistence data.
 * No side effects, no mutations, fully testable.
 */
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getByNotebook } from '@/persistence/repositories/graph';
import { getSessionEvents } from '@/persistence/repositories/events';
import type { MasteryRecord } from '@/persistence/records';

// ─── Learning gaps ────────────────────────────────────────

export interface LearningGap {
  /** What's underdeveloped. */
  concept: string;
  conceptId: string;
  currentLevel: string;
  currentPercentage: number;
  /** Why this is a gap — relative to connected strong concepts. */
  reason: string;
  /** Suggested action. */
  suggestion: string;
  /** Priority score 0–1 (higher = address sooner). */
  priority: number;
}

/**
 * Find learning gaps — concepts that are weak relative to their
 * neighbors in the knowledge graph.
 *
 * A "gap" is a concept at 'exploring' level that has strong or
 * mastered neighbors. The student is deep in one area but shallow
 * in an adjacent one — that's where the tutor should guide.
 */
export async function findLearningGaps(
  notebookId: string,
): Promise<LearningGap[]> {
  const mastery = await getMasteryByNotebook(notebookId);
  const relations = await getByNotebook(notebookId);
  const gaps: LearningGap[] = [];

  const masteryMap = new Map(mastery.map((m) => [m.id, m]));

  for (const concept of mastery) {
    if (concept.percentage >= 60) continue; // Not a gap

    // Find connected concepts via graph
    const connected = relations.filter(
      (r) => (r.from === concept.id || r.to === concept.id) &&
             (r.fromKind === 'concept' || r.toKind === 'concept'),
    );

    const neighborIds = connected.map((r) =>
      r.from === concept.id ? r.to : r.from,
    );

    const strongNeighbors = neighborIds
      .map((id) => masteryMap.get(id))
      .filter((m): m is MasteryRecord => m !== undefined && m.percentage > 60);

    if (strongNeighbors.length > 0) {
      const strongNames = strongNeighbors.map((m) => m.concept).join(', ');
      gaps.push({
        concept: concept.concept,
        conceptId: concept.id,
        currentLevel: concept.level,
        currentPercentage: concept.percentage,
        reason: `Adjacent to strong concepts: ${strongNames}`,
        suggestion: `Explore how ${concept.concept} connects to ${strongNeighbors[0]!.concept}`,
        priority: Math.min(1, strongNeighbors.length * 0.3 + (1 - concept.percentage / 100)),
      });
    }
  }

  return gaps.sort((a, b) => b.priority - a.priority);
}

// ─── Mastery trajectory ───────────────────────────────────

export interface MasteryTrajectory {
  concept: string;
  /** Ordered snapshots of mastery over time. */
  snapshots: Array<{ percentage: number; timestamp: number }>;
  /** Trend: growing, stalling, or declining. */
  trend: 'growing' | 'stalling' | 'declining';
  /** Rate of change (percentage points per session). */
  velocity: number;
}

/**
 * Compute mastery trajectories from the event log.
 * Shows whether understanding is growing or stalling.
 */
export async function computeTrajectories(
  notebookId: string,
  sessionId: string,
): Promise<MasteryTrajectory[]> {
  const mastery = await getMasteryByNotebook(notebookId);
  const events = await getSessionEvents(sessionId);

  // Extract mastery-updated events
  const masteryEvents = events
    .filter((e) => e.event.type === 'mastery-updated')
    .map((e) => e.event as { type: 'mastery-updated'; conceptId: string; from: number; to: number; timestamp: number });

  const byConceptId = new Map<string, Array<{ from: number; to: number; timestamp: number }>>();

  for (const event of masteryEvents) {
    if (!byConceptId.has(event.conceptId)) {
      byConceptId.set(event.conceptId, []);
    }
    byConceptId.get(event.conceptId)!.push(event);
  }

  return mastery.map((m) => {
    const changes = byConceptId.get(m.id) ?? [];
    const snapshots = changes.map((c) => ({
      percentage: c.to,
      timestamp: c.timestamp,
    }));

    // Add current state
    snapshots.push({
      percentage: m.percentage,
      timestamp: m.updatedAt,
    });

    const velocity = snapshots.length >= 2
      ? (snapshots[snapshots.length - 1]!.percentage - snapshots[0]!.percentage) / snapshots.length
      : 0;

    const trend: MasteryTrajectory['trend'] =
      velocity > 2 ? 'growing' :
      velocity < -2 ? 'declining' :
      'stalling';

    return {
      concept: m.concept,
      snapshots,
      trend,
      velocity,
    };
  });
}

// ─── Exploration suggestions ──────────────────────────────

export interface ExplorationSuggestion {
  /** What to explore. */
  target: string;
  targetId: string;
  targetKind: string;
  /** Why it's interesting. */
  reason: string;
  /** How it connects to what the student already knows. */
  bridge: string;
  /** Confidence 0–1 that this would be a productive exploration. */
  confidence: number;
}

/**
 * Suggest what to explore next based on graph topology.
 *
 * Strategy:
 * 1. Find highly-connected entities the student hasn't explored deeply
 * 2. Find entities at the frontier (1-hop from explored territory)
 * 3. Find dormant thinkers whose ideas connect to active concepts
 */
export async function suggestExplorations(
  notebookId: string,
): Promise<ExplorationSuggestion[]> {
  const [mastery, encounters, relations] = await Promise.all([
    getMasteryByNotebook(notebookId),
    getEncountersByNotebook(notebookId),
    getByNotebook(notebookId),
  ]);

  const suggestions: ExplorationSuggestion[] = [];

  // Strategy 1: Highly-connected but low-mastery concepts
  const connectionCount = new Map<string, number>();
  for (const r of relations) {
    connectionCount.set(r.from, (connectionCount.get(r.from) ?? 0) + 1);
    connectionCount.set(r.to, (connectionCount.get(r.to) ?? 0) + 1);
  }

  for (const m of mastery) {
    const connections = connectionCount.get(m.id) ?? 0;
    if (connections >= 3 && m.percentage < 40) {
      suggestions.push({
        target: m.concept,
        targetId: m.id,
        targetKind: 'concept',
        reason: `${connections} connections but only ${m.percentage}% mastery — a hub worth exploring`,
        bridge: `Connected to ${connections} other concepts in your graph`,
        confidence: Math.min(1, connections * 0.15),
      });
    }
  }

  // Strategy 2: Dormant thinkers whose ideas connect to active concepts
  const activeConcepts = new Set(
    mastery.filter((m) => m.percentage >= 40).map((m) => m.id),
  );

  for (const enc of encounters) {
    if (enc.status !== 'dormant' && enc.status !== 'pending') continue;

    const thinkerRelations = relations.filter(
      (r) => r.from === enc.id || r.to === enc.id,
    );
    const touchesActive = thinkerRelations.some(
      (r) => activeConcepts.has(r.from) || activeConcepts.has(r.to),
    );

    if (touchesActive) {
      suggestions.push({
        target: enc.thinker,
        targetId: enc.id,
        targetKind: 'thinker',
        reason: `${enc.thinker}'s ideas on "${enc.coreIdea}" connect to concepts you're developing`,
        bridge: `First encountered on ${enc.date}`,
        confidence: 0.6,
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// ─── Thread tracking ──────────────────────────────────────

export interface TrackedThread {
  question: string;
  curiosityId: string;
  /** Whether entries in the graph suggest this was addressed. */
  status: 'open' | 'partially-addressed' | 'resolved';
  /** Entry IDs related to this question. */
  relatedEntries: string[];
  /** When the question was first asked. */
  askedAt: number;
}

/**
 * Track the status of curiosity threads — which questions
 * are open, which have been addressed, which are stale.
 */
export async function trackThreads(
  notebookId: string,
): Promise<TrackedThread[]> {
  const curiosities = await getCuriositiesByNotebook(notebookId);
  const relations = await getByNotebook(notebookId);

  return curiosities.map((c) => {
    const related = relations.filter(
      (r) => r.from === c.id || r.to === c.id,
    );

    const relatedEntries = related.map((r) =>
      r.from === c.id ? r.to : r.from,
    ).filter((id) => id !== c.id);

    const status: TrackedThread['status'] =
      relatedEntries.length >= 3 ? 'resolved' :
      relatedEntries.length >= 1 ? 'partially-addressed' :
      'open';

    return {
      question: c.question,
      curiosityId: c.id,
      status,
      relatedEntries,
      askedAt: c.createdAt,
    };
  });
}

// ─── Concept clusters ─────────────────────────────────────

export interface ConceptCluster {
  /** Name derived from the highest-mastery concept in the cluster. */
  name: string;
  /** Concept IDs in this cluster. */
  concepts: Array<{ id: string; concept: string; percentage: number }>;
  /** Average mastery across the cluster. */
  avgMastery: number;
  /** How tightly connected the cluster is (0–1). */
  density: number;
}

/**
 * Find natural clusters of related concepts using graph connectivity.
 * Uses a simple connected-component algorithm on concept-to-concept edges.
 */
export async function findConceptClusters(
  notebookId: string,
): Promise<ConceptCluster[]> {
  const mastery = await getMasteryByNotebook(notebookId);
  const relations = await getByNotebook(notebookId);

  // Build adjacency for concepts only
  const conceptIds = new Set(mastery.map((m) => m.id));
  const adj = new Map<string, Set<string>>();

  for (const r of relations) {
    if (!conceptIds.has(r.from) || !conceptIds.has(r.to)) continue;
    if (!adj.has(r.from)) adj.set(r.from, new Set());
    if (!adj.has(r.to)) adj.set(r.to, new Set());
    adj.get(r.from)!.add(r.to);
    adj.get(r.to)!.add(r.from);
  }

  // Connected components via BFS
  const visited = new Set<string>();
  const clusters: ConceptCluster[] = [];
  const masteryMap = new Map(mastery.map((m) => [m.id, m]));

  for (const m of mastery) {
    if (visited.has(m.id)) continue;

    const component: string[] = [];
    const queue = [m.id];
    visited.add(m.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length < 2) continue; // Skip singletons

    const concepts = component
      .map((id) => masteryMap.get(id))
      .filter((m): m is MasteryRecord => m !== undefined)
      .map((m) => ({ id: m.id, concept: m.concept, percentage: m.percentage }));

    const avgMastery = concepts.reduce((sum, c) => sum + c.percentage, 0) / concepts.length;
    const edgeCount = component.reduce((sum, id) =>
      sum + (adj.get(id)?.size ?? 0), 0,
    ) / 2;
    const maxEdges = component.length * (component.length - 1) / 2;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

    const topConcept = concepts.sort((a, b) => b.percentage - a.percentage)[0]!;

    clusters.push({
      name: topConcept.concept,
      concepts,
      avgMastery,
      density,
    });
  }

  return clusters.sort((a, b) => b.concepts.length - a.concepts.length);
}
