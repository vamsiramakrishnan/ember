/**
 * CrossNotebookBridge — discovers surprising connections between
 * concepts across different notebooks.
 *
 * This is the "aha" engine. When a student is exploring harmonic
 * ratios in their Music & Mathematics notebook, this module can
 * find that "ratio" also appears in their Evolution notebook
 * (genetic ratios), or that Pythagoras bridges to their Language
 * notebook (etymology of "harmony").
 *
 * The bridge works by:
 * 1. Getting all mastery/encounter data across all notebooks
 * 2. Finding matching labels (exact and fuzzy)
 * 3. Ranking bridges by surprise (cross-domain > same-domain)
 * 4. Returning the most interesting connections
 *
 * Pure computation — no side effects, no mutations.
 */
import { getAll } from '@/persistence/engine';
import { Store } from '@/persistence/schema';
import type { MasteryRecord, EncounterRecord, NotebookRecord, LexiconRecord } from '@/persistence/records';

export interface CrossNotebookBridge {
  /** What the bridge connects. */
  concept: string;
  /** Source notebook. */
  fromNotebook: { id: string; title: string };
  /** Target notebook (the surprising connection). */
  toNotebook: { id: string; title: string };
  /** What makes this bridge interesting. */
  reason: string;
  /** Confidence that this is a genuine, productive connection (0–1). */
  confidence: number;
  /** Type of bridge. */
  bridgeType: 'concept-overlap' | 'thinker-overlap' | 'term-overlap';
}

/**
 * Find cross-notebook bridges for a student.
 * Returns bridges sorted by confidence (most surprising first).
 */
export async function findCrossNotebookBridges(
  studentId: string,
  currentNotebookId: string,
): Promise<CrossNotebookBridge[]> {
  const [notebooks, allMastery, allEncounters, allLexicon] = await Promise.all([
    getAll<NotebookRecord>(Store.Notebooks),
    getAll<MasteryRecord>(Store.Mastery),
    getAll<EncounterRecord>(Store.Encounters),
    getAll<LexiconRecord>(Store.Lexicon),
  ]);

  const studentNotebooks = notebooks.filter((n) => n.studentId === studentId);
  const nbMap = new Map(studentNotebooks.map((n) => [n.id, n]));
  const currentNb = nbMap.get(currentNotebookId);
  if (!currentNb) return [];

  const bridges: CrossNotebookBridge[] = [];

  // Strategy 1: Concept overlap
  const currentConcepts = allMastery.filter((m) => m.notebookId === currentNotebookId);
  const otherConcepts = allMastery.filter((m) => m.notebookId !== currentNotebookId && m.studentId === studentId);

  for (const current of currentConcepts) {
    for (const other of otherConcepts) {
      const similarity = labelSimilarity(current.concept, other.concept);
      if (similarity < 0.6) continue;

      const otherNb = nbMap.get(other.notebookId);
      if (!otherNb) continue;

      bridges.push({
        concept: current.concept,
        fromNotebook: { id: currentNb.id, title: currentNb.title },
        toNotebook: { id: otherNb.id, title: otherNb.title },
        reason: `"${current.concept}" in ${currentNb.title} connects to "${other.concept}" in ${otherNb.title}`,
        confidence: similarity * 0.8,
        bridgeType: 'concept-overlap',
      });
    }
  }

  // Strategy 2: Thinker overlap
  const currentThinkers = allEncounters.filter((e) => e.notebookId === currentNotebookId);
  const otherThinkers = allEncounters.filter((e) => e.notebookId !== currentNotebookId && e.studentId === studentId);

  for (const current of currentThinkers) {
    for (const other of otherThinkers) {
      if (current.thinker.toLowerCase() !== other.thinker.toLowerCase()) continue;

      const otherNb = nbMap.get(other.notebookId);
      if (!otherNb) continue;

      bridges.push({
        concept: current.thinker,
        fromNotebook: { id: currentNb.id, title: currentNb.title },
        toNotebook: { id: otherNb.id, title: otherNb.title },
        reason: `${current.thinker} appears in both ${currentNb.title} and ${otherNb.title}`,
        confidence: 0.9,
        bridgeType: 'thinker-overlap',
      });
    }
  }

  // Strategy 3: Term overlap
  const currentTerms = allLexicon.filter((l) => l.notebookId === currentNotebookId);
  const otherTerms = allLexicon.filter((l) => l.notebookId !== currentNotebookId && l.studentId === studentId);

  for (const current of currentTerms) {
    for (const other of otherTerms) {
      if (current.term.toLowerCase() !== other.term.toLowerCase()) continue;

      const otherNb = nbMap.get(other.notebookId);
      if (!otherNb) continue;

      bridges.push({
        concept: current.term,
        fromNotebook: { id: currentNb.id, title: currentNb.title },
        toNotebook: { id: otherNb.id, title: otherNb.title },
        reason: `Term "${current.term}" defined in both notebooks — compare definitions`,
        confidence: 0.85,
        bridgeType: 'term-overlap',
      });
    }
  }

  // Deduplicate and sort
  const seen = new Set<string>();
  return bridges
    .filter((b) => {
      const key = `${b.concept}:${b.fromNotebook.id}:${b.toNotebook.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.confidence - a.confidence);
}

// ─── Helpers ──────────────────────────────────────────────

/** Compute label similarity (0–1). Handles substring, case, and partial matching. */
function labelSimilarity(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();

  if (la === lb) return 1.0;
  if (la.includes(lb) || lb.includes(la)) return 0.8;

  // Word overlap
  const wordsA = new Set(la.split(/\s+/));
  const wordsB = new Set(lb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);

  if (union.size === 0) return 0;
  return intersection.length / union.size;
}
