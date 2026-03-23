/**
 * useEntityIndex — ultra-low-latency local search index over all
 * referenceable entities in the student's intellectual universe.
 *
 * Rebuilt from IndexedDB on notebook open. Searched in-memory
 * with fuzzy matching — zero API calls, sub-millisecond results.
 *
 * Powers the @ mention popup and / slash commands.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { getNotebooksByStudent } from '@/persistence/repositories/notebooks';
import { getSessionsByNotebook } from '@/persistence/repositories/sessions';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import type { LiveEntry } from '@/types/entries';
import { type Entity, type EntityType, fuzzyScore } from './entity-types';
import { decomposeEntries } from './entity-decompose';

// Re-export types so existing consumers don't break
export type { Entity, EntityType } from './entity-types';

export function useEntityIndex() {
  const { student, notebook } = useStudent();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [ready, setReady] = useState(false);
  const cacheKeyRef = useRef<string>('');
  const buildingRef = useRef(false);

  useEffect(() => {
    if (!student) return;
    const cacheKey = `${student.id}:${notebook?.id ?? ''}`;
    if (cacheKey === cacheKeyRef.current || buildingRef.current) return;
    buildingRef.current = true;
    cacheKeyRef.current = cacheKey;

    void buildIndex(student.id, notebook?.id).then((all) => {
      setEntities(all);
      setReady(true);
      buildingRef.current = false;
    });
  }, [student, notebook]);

  const entryEntitiesRef = useRef<Entity[]>([]);

  const registerEntries = useCallback((
    liveEntries: LiveEntry[], notebookId: string,
  ) => {
    entryEntitiesRef.current = decomposeEntries(liveEntries, notebookId);
  }, []);

  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  const search = useCallback((
    query: string,
    opts?: { type?: EntityType; limit?: number },
  ): Entity[] => {
    const all = [...entitiesRef.current, ...entryEntitiesRef.current];
    if (!query.trim()) {
      const filtered = opts?.type ? all.filter((e) => e.type === opts.type) : all;
      return filtered.slice(0, opts?.limit ?? 8);
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

/** Build the full entity index from IndexedDB repositories. */
async function buildIndex(studentId: string, currentNotebookId?: string): Promise<Entity[]> {
  const all: Entity[] = [];
  const notebooks = await getNotebooksByStudent(studentId);

  for (const nb of notebooks) {
    all.push({ id: nb.id, type: 'notebook', name: nb.title, detail: nb.description });
    const sessions = await getSessionsByNotebook(nb.id);
    for (const s of sessions) {
      all.push({ id: s.id, type: 'session', name: `Session ${s.number}: ${s.topic}`, detail: s.date, notebookId: nb.id });
    }
    if (nb.id === currentNotebookId) {
      const [lexicon, encounters, library, mastery, curiosities] = await Promise.all([
        getLexiconByNotebook(nb.id), getEncountersByNotebook(nb.id),
        getLibraryByNotebook(nb.id), getMasteryByNotebook(nb.id), getCuriositiesByNotebook(nb.id),
      ]);
      for (const l of lexicon) all.push({ id: l.id, type: 'term', name: l.term, detail: l.definition, notebookId: nb.id });
      for (const e of encounters) all.push({ id: e.id, type: 'thinker', name: e.thinker, detail: e.coreIdea, notebookId: nb.id });
      for (const lib of library) all.push({ id: lib.id, type: 'text', name: `${lib.title} by ${lib.author}`, detail: lib.quote, notebookId: nb.id });
      for (const m of mastery) all.push({ id: m.id, type: 'concept', name: m.concept, detail: `${m.level} (${m.percentage}%)`, notebookId: nb.id });
      for (const c of curiosities) all.push({ id: c.id, type: 'question', name: c.question, detail: '', notebookId: nb.id });
    }
  }
  return all;
}
