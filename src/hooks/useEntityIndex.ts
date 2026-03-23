/**
 * useEntityIndex — ultra-low-latency local search index over all
 * referenceable entities in the student's intellectual universe.
 *
 * Entities: notebooks, sessions, thinkers, concepts, lexicon terms,
 * curiosity questions, library texts.
 *
 * Rebuilt from IndexedDB on notebook open. Searched in-memory
 * with fuzzy matching — zero API calls, sub-millisecond results.
 *
 * Powers the @ mention popup and / slash commands.
 *
 * Improvements:
 * - Caches results per notebook ID to avoid redundant rebuilds
 * - Only rebuilds constellation data when notebook changes
 * - Memoized search function with stable reference
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { getNotebooksByStudent } from '@/persistence/repositories/notebooks';
import { getSessionsByNotebook } from '@/persistence/repositories/sessions';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getCuriositiesByNotebook } from '@/persistence/repositories/mastery';

// ─── Entity types ────────────────────────────────────────────────────

export type EntityType =
  | 'notebook'
  | 'session'
  | 'thinker'
  | 'concept'
  | 'term'
  | 'text'
  | 'question';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  /** Secondary text (e.g., notebook description, thinker tradition). */
  detail: string;
  /** The ID of the notebook this entity belongs to. */
  notebookId?: string;
}

// ─── Fuzzy search ────────────────────────────────────────────────────

/**
 * Fast fuzzy match: checks if all query chars appear in order.
 * Returns a score (lower = better match). -1 = no match.
 */
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return 0;
  if (t.includes(q)) return q.length; // Exact substring = best

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatchIdx === ti - 1 ? 2 : 1;
      lastMatchIdx = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useEntityIndex() {
  const { student, notebook } = useStudent();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [ready, setReady] = useState(false);
  const cacheKeyRef = useRef<string>('');
  const buildingRef = useRef(false);

  // Build the index from IndexedDB — cached per student+notebook pair
  useEffect(() => {
    if (!student) return;

    const cacheKey = `${student.id}:${notebook?.id ?? ''}`;
    if (cacheKey === cacheKeyRef.current) return;
    if (buildingRef.current) return;

    buildingRef.current = true;
    cacheKeyRef.current = cacheKey;

    const build = async () => {
      const all: Entity[] = [];

      const notebooks = await getNotebooksByStudent(student.id);
      for (const nb of notebooks) {
        all.push({
          id: nb.id,
          type: 'notebook',
          name: nb.title,
          detail: nb.description,
        });

        const sessions = await getSessionsByNotebook(nb.id);
        for (const s of sessions) {
          all.push({
            id: s.id,
            type: 'session',
            name: `Session ${s.number}: ${s.topic}`,
            detail: s.date,
            notebookId: nb.id,
          });
        }

        // Constellation data only for current notebook
        if (nb.id === notebook?.id) {
          const [lexicon, encounters, library, mastery, curiosities] = await Promise.all([
            getLexiconByNotebook(nb.id),
            getEncountersByNotebook(nb.id),
            getLibraryByNotebook(nb.id),
            getMasteryByNotebook(nb.id),
            getCuriositiesByNotebook(nb.id),
          ]);

          for (const l of lexicon) {
            all.push({
              id: l.id, type: 'term', name: l.term,
              detail: l.definition, notebookId: nb.id,
            });
          }
          for (const e of encounters) {
            all.push({
              id: e.id, type: 'thinker', name: e.thinker,
              detail: e.coreIdea, notebookId: nb.id,
            });
          }
          for (const lib of library) {
            all.push({
              id: lib.id, type: 'text',
              name: `${lib.title} by ${lib.author}`,
              detail: lib.quote, notebookId: nb.id,
            });
          }
          for (const m of mastery) {
            all.push({
              id: m.id, type: 'concept', name: m.concept,
              detail: `${m.level} (${m.percentage}%)`,
              notebookId: nb.id,
            });
          }
          for (const c of curiosities) {
            all.push({
              id: c.id, type: 'question', name: c.question,
              detail: '', notebookId: nb.id,
            });
          }
        }
      }

      setEntities(all);
      setReady(true);
      buildingRef.current = false;
    };

    void build();
  }, [student, notebook]);

  // Use ref for entities to keep search callback stable
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  /**
   * Search the index with a query string.
   * Returns top N matches sorted by relevance.
   * Stable callback — doesn't recreate when entities change.
   */
  const search = useCallback((
    query: string,
    opts?: { type?: EntityType; limit?: number },
  ): Entity[] => {
    const currentEntities = entitiesRef.current;
    if (!query.trim()) {
      const limit = opts?.limit ?? 8;
      const filtered = opts?.type
        ? currentEntities.filter((e) => e.type === opts.type)
        : currentEntities;
      return filtered.slice(0, limit);
    }

    const scored = currentEntities
      .filter((e) => !opts?.type || e.type === opts.type)
      .map((e) => ({
        entity: e,
        score: Math.max(
          fuzzyScore(query, e.name),
          fuzzyScore(query, e.detail) * 0.5,
        ),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, opts?.limit ?? 8).map((s) => s.entity);
  }, []);

  return { entities, search, ready };
}
