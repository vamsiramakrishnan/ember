/**
 * entity-types — entity type definitions and fuzzy search scoring
 * for the entity index system.
 *
 * Extracted from useEntityIndex to enforce the 150-line file limit.
 */

/** The kind of referenceable entity in the student's universe. */
export type EntityType =
  | 'notebook'
  | 'session'
  | 'thinker'
  | 'concept'
  | 'term'
  | 'text'
  | 'question'
  | 'entry'
  | 'slide'
  | 'card'
  | 'exercise'
  | 'code'
  | 'diagram'
  | 'image'
  | 'file'
  | 'tutor-note'
  | 'podcast';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  /** Secondary text (e.g., notebook description, thinker tradition). */
  detail: string;
  /** The ID of the notebook this entity belongs to. */
  notebookId?: string;
  /** Meta label for display — e.g., "slide 3 of 8", "card 2", "python". */
  meta?: string;
  /** Parent entry ID — for sub-entry references (slide within reading material). */
  parentId?: string;
}

/**
 * Fast fuzzy match: checks if all query chars appear in order.
 * Returns a score (lower = better match). -1 = no match.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return 0;
  if (t.includes(q)) return q.length; // Exact substring = best

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatchIdx === ti - 1 ? 2 : 1;
      lastMatchIdx = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}
