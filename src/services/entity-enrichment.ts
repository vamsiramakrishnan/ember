/**
 * Entity Enrichment — creates and enriches entities from arbitrary @ mentions.
 *
 * When a student @mentions something that doesn't exist, this service:
 * 1. Creates a stub entity immediately (optimistic, instant UX)
 * 2. Runs Gemini flash-lite + Google Search grounding to fill metadata
 * 3. Persists the enriched entity to the appropriate repository
 * 4. Notifies the store so the UI updates reactively
 *
 * Cost: ~150 output tokens per enrichment. Sub-500ms with flash-lite.
 */
import { isGeminiAvailable } from './gemini';
import { runTextAgent } from './run-agent';
import { micro, TOOLS } from './agents';
import { entityEnrichmentSchema } from './schemas';
import { Store, notify } from '@/persistence';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { upsertMastery } from '@/persistence/repositories/mastery';
import type { Entity, EntityType } from '@/hooks/entity-types';

const ENRICHER = {
  ...micro(
    `You are a knowledge enrichment agent. Given an entity name and optional context,
identify what kind of entity this is and provide rich metadata.
- For thinkers: name, dates, intellectual tradition, core idea/contribution.
- For concepts: name, a clear definition, related discipline.
- For terms: name, definition, etymology if known.
- For questions: restate as a clear intellectual question.
Always provide a 1-sentence "detail" summary. Use Google Search for accuracy.`,
    entityEnrichmentSchema,
  ),
  tools: [TOOLS.googleSearch],
};

export interface StubEntity extends Entity {
  enriching: boolean;
}

/** Create a stub entity instantly, return it for immediate use. */
export function createStub(name: string, notebookId: string): StubEntity {
  return {
    id: `stub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'concept' as EntityType,
    name,
    detail: '',
    notebookId,
    meta: 'enriching\u2026',
    enriching: true,
  };
}

export interface EnrichmentResult {
  entity: Entity;
  persistedId: string;
}

/** Enrich a stub entity via Gemini + grounding, persist to appropriate store. */
export async function enrichEntity(
  name: string,
  context: string,
  studentId: string,
  notebookId: string,
  sessionTopic: string,
): Promise<EnrichmentResult | null> {
  if (!isGeminiAvailable()) return null;

  try {
    const result = await runTextAgent(ENRICHER, [{
      role: 'user',
      parts: [{ text: `Entity: "${name}"\nContext: ${context || sessionTopic}` }],
    }]);

    const parsed = JSON.parse(result.text) as Record<string, string | undefined>;
    const kind = parsed.kind ?? 'concept';
    const detail = parsed.detail ?? '';

    if (kind === 'thinker') {
      return persistThinker(parsed, studentId, notebookId, sessionTopic);
    } else if (kind === 'term') {
      return persistTerm(parsed, studentId, notebookId);
    } else {
      return persistConcept(parsed, studentId, notebookId);
    }
  } catch (err) {
    console.error('[Ember] Entity enrichment failed:', err);
    return null;
  }
}

async function persistThinker(
  d: Record<string, string | undefined>, sId: string, nId: string, topic: string,
): Promise<EnrichmentResult> {
  const existing = await getEncountersByNotebook(nId);
  const r = await createEncounter({
    studentId: sId, notebookId: nId, ref: `T${existing.length + 1}`,
    thinker: d.name ?? '', tradition: d.tradition ?? '',
    coreIdea: d.coreIdea ?? d.detail ?? '', sessionTopic: topic,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }), status: 'active',
  });
  notify(Store.Encounters);
  return { entity: { id: r.id, type: 'thinker', name: r.thinker, detail: r.coreIdea, notebookId: nId }, persistedId: r.id };
}

async function persistTerm(
  d: Record<string, string | undefined>, sId: string, nId: string,
): Promise<EnrichmentResult> {
  const existing = await getLexiconByNotebook(nId);
  const r = await createLexiconEntry({
    studentId: sId, notebookId: nId, number: existing.length + 1,
    term: d.name ?? '', pronunciation: '', definition: d.definition ?? d.detail ?? '',
    level: 'exploring', percentage: 10, etymology: d.etymology ?? '', crossReferences: [],
  });
  notify(Store.Lexicon);
  return { entity: { id: r.id, type: 'term', name: r.term, detail: r.definition, notebookId: nId }, persistedId: r.id };
}

async function persistConcept(
  d: Record<string, string | undefined>, sId: string, nId: string,
): Promise<EnrichmentResult> {
  const r = await upsertMastery({ studentId: sId, notebookId: nId, concept: d.name ?? '', level: 'exploring', percentage: 5 });
  notify(Store.Mastery);
  return { entity: { id: r.id, type: 'concept', name: r.concept, detail: d.detail ?? '', notebookId: nId }, persistedId: r.id };
}
