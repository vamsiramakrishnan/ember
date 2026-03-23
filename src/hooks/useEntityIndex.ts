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
import type { LiveEntry } from '@/types/entries';

// ─── Entity types ────────────────────────────────────────────────────

export type EntityType =
  | 'notebook'
  | 'session'
  | 'thinker'
  | 'concept'
  | 'term'
  | 'text'
  | 'question'
  // Entry-level references — universally referenceable content
  | 'entry'
  | 'slide'
  | 'card'
  | 'exercise'
  | 'code'
  | 'diagram'
  | 'image'
  | 'file'
  | 'tutor-note';

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

// ─── Entry decomposition ─────────────────────────────────────────────

/** Extract referenceable entities from live notebook entries. */
function decomposeEntries(entries: LiveEntry[], notebookId: string): Entity[] {
  const result: Entity[] = [];

  for (const le of entries) {
    const e = le.entry;

    switch (e.type) {
      case 'prose':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.content.slice(0, 60).replace(/\n/g, ' '),
          detail: 'student note',
          meta: 'prose',
        });
        break;
      case 'hypothesis':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.content.slice(0, 60).replace(/\n/g, ' '),
          detail: 'student hypothesis',
          meta: 'hypothesis',
        });
        break;
      case 'question':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.content.slice(0, 60).replace(/\n/g, ' '),
          detail: 'student question',
          meta: 'question',
        });
        break;
      case 'tutor-marginalia':
      case 'tutor-question':
      case 'tutor-connection':
        result.push({
          id: le.id, type: 'tutor-note', notebookId,
          name: e.content.slice(0, 60).replace(/\n/g, ' '),
          detail: e.type.replace('tutor-', ''),
          meta: e.type.replace('tutor-', ''),
        });
        break;
      case 'reading-material':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.title, detail: `${e.slides.length} slides`,
          meta: 'reading',
        });
        for (let i = 0; i < e.slides.length; i++) {
          result.push({
            id: `${le.id}:slide:${i}`, type: 'slide', notebookId,
            name: e.slides[i]!.heading,
            detail: e.slides[i]!.body.slice(0, 50),
            meta: `slide ${i + 1} of ${e.slides.length}`,
            parentId: le.id,
          });
        }
        break;
      case 'flashcard-deck':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.title, detail: `${e.cards.length} cards`,
          meta: 'deck',
        });
        for (let i = 0; i < e.cards.length; i++) {
          result.push({
            id: `${le.id}:card:${i}`, type: 'card', notebookId,
            name: e.cards[i]!.front.slice(0, 60),
            detail: e.cards[i]!.concept ?? '',
            meta: `card ${i + 1}`,
            parentId: le.id,
          });
        }
        break;
      case 'exercise-set':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.title, detail: `${e.exercises.length} exercises`,
          meta: e.difficulty,
        });
        for (let i = 0; i < e.exercises.length; i++) {
          result.push({
            id: `${le.id}:exercise:${i}`, type: 'exercise', notebookId,
            name: e.exercises[i]!.prompt.slice(0, 60),
            detail: e.exercises[i]!.concept ?? '',
            meta: `#${i + 1} · ${e.exercises[i]!.format}`,
            parentId: le.id,
          });
        }
        break;
      case 'code-cell':
        result.push({
          id: le.id, type: 'code', notebookId,
          name: e.source.split('\n')[0]?.slice(0, 60) ?? 'code',
          detail: e.language,
          meta: e.language,
        });
        break;
      case 'concept-diagram':
        result.push({
          id: le.id, type: 'diagram', notebookId,
          name: e.title ?? e.items.map((n) => n.label).join(', '),
          detail: `${e.items.length} nodes`,
          meta: 'diagram',
        });
        break;
      case 'image':
        result.push({
          id: le.id, type: 'image', notebookId,
          name: e.alt ?? e.caption ?? 'image',
          detail: e.caption ?? '',
          meta: 'image',
        });
        break;
      case 'file-upload':
        result.push({
          id: le.id, type: 'file', notebookId,
          name: e.file.name,
          detail: e.file.mimeType,
          meta: e.file.name.split('.').pop() ?? 'file',
        });
        break;
      case 'document':
        result.push({
          id: le.id, type: 'file', notebookId,
          name: e.file.name,
          detail: `${e.pages ?? '?'} pages`,
          meta: 'pdf',
        });
        break;
      case 'thinker-card':
        result.push({
          id: le.id, type: 'entry', notebookId,
          name: e.thinker.name,
          detail: e.thinker.gift,
          meta: 'thinker',
        });
        break;
    }
  }

  return result;
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

  // Entry-level entities from the current session — registered externally
  const entryEntitiesRef = useRef<Entity[]>([]);

  /**
   * Register live entries from the current session for @ referencing.
   * Call this from the Notebook surface whenever entries change.
   */
  const registerEntries = useCallback((
    liveEntries: LiveEntry[], notebookId: string,
  ) => {
    entryEntitiesRef.current = decomposeEntries(liveEntries, notebookId);
  }, []);

  // Merge constellation entities + entry entities for search
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  /**
   * Search the index with a query string.
   * Returns top N matches sorted by relevance.
   * Searches both constellation entities AND current session entries.
   */
  const search = useCallback((
    query: string,
    opts?: { type?: EntityType; limit?: number },
  ): Entity[] => {
    const all = [...entitiesRef.current, ...entryEntitiesRef.current];
    if (!query.trim()) {
      const limit = opts?.limit ?? 8;
      const filtered = opts?.type
        ? all.filter((e) => e.type === opts.type)
        : all;
      return filtered.slice(0, limit);
    }

    const scored = all
      .filter((e) => !opts?.type || e.type === opts.type)
      .map((e) => ({
        entity: e,
        score: Math.max(
          fuzzyScore(query, e.name),
          fuzzyScore(query, e.detail) * 0.5,
          e.meta ? fuzzyScore(query, e.meta) * 0.3 : -1,
        ),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, opts?.limit ?? 8).map((s) => s.entity);
  }, []);

  return { entities, search, ready, registerEntries };
}
