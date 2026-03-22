/**
 * Background Tasks — intelligent post-response task dispatcher.
 *
 * After the tutor responds, this system assesses what background
 * work needs to happen. Instead of heavy extraction every 5 entries,
 * it runs targeted micro-tasks per-entry with precisely scoped context.
 *
 * Context tiers:
 * - MINIMAL: just the entry text (~50 tokens). For binary classification.
 * - FOCUSED: entry + relevant existing records (~200 tokens). For extraction.
 * - FULL: conversation window + profile (~800 tokens). For synthesis.
 *
 * All micro-tasks use flash-lite with MINIMAL thinking (~50-100ms each).
 */
import { runTextAgent } from './run-agent';
import { isGeminiAvailable } from './gemini';
import { Store, notify } from '@/persistence';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { upsertMastery } from '@/persistence/repositories/mastery';
import type { AgentConfig } from './agents';
import type { ZodTypeAny } from 'zod';
import {
  taskSignalsSchema,
  thinkerExtractionSchema,
  vocabExtractionSchema,
  masteryUpdateSchema,
} from './schemas';
import type { NotebookEntry } from '@/types/entries';

// ─── Micro-agent (shared config for all background tasks) ────────────

const MICRO_AGENT: AgentConfig = {
  name: 'MicroTask',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: '',
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

function micro(instruction: string, schema?: ZodTypeAny): AgentConfig {
  return { ...MICRO_AGENT, systemInstruction: instruction, responseSchema: schema };
}

// ─── Task Assessment ─────────────────────────────────────────────────

export interface TaskSignals {
  updateThinkers: boolean;
  updateVocabulary: boolean;
  updateMastery: boolean;
  updateCuriosities: boolean;
}

const ASSESSOR = micro(
  `Given a tutor response and the student's entry, assess what background data needs updating.
- updateThinkers: true if a new thinker/scientist/philosopher was mentioned BY NAME
- updateVocabulary: true if a technical term was defined or used for the first time
- updateMastery: true if the student demonstrated understanding or misconception of a concept
- updateCuriosities: true if a new open question emerged`,
  taskSignalsSchema,
);

export async function assessTasks(
  studentText: string,
  tutorEntries: NotebookEntry[],
): Promise<TaskSignals> {
  if (!isGeminiAvailable()) return noTasks();

  const tutorText = tutorEntries
    .filter((e) => 'content' in e)
    .map((e) => ('content' in e ? e.content : ''))
    .join(' ');

  try {
    const result = await runTextAgent(ASSESSOR, [{
      role: 'user',
      parts: [{ text: `Student: "${studentText}"\nTutor: "${tutorText}"` }],
    }]);
    return parseSignals(result.text);
  } catch {
    return noTasks();
  }
}

function noTasks(): TaskSignals {
  return { updateThinkers: false, updateVocabulary: false, updateMastery: false, updateCuriosities: false };
}

// ─── Thinker Extractor (MINIMAL context) ─────────────────────────────

const THINKER_EXTRACTOR = micro(
  `Extract thinker mentions from this text. Only include real historical figures. If none mentioned, return empty thinkers array.`,
  thinkerExtractionSchema,
);

export async function extractThinkers(
  text: string,
  studentId: string,
  notebookId: string,
  sessionTopic: string,
): Promise<number> {
  const result = await runTextAgent(THINKER_EXTRACTOR, [{
    role: 'user', parts: [{ text }],
  }]);

  const parsed = parseJson(result.text);
  const thinkers = Array.isArray(parsed?.thinkers) ? parsed.thinkers : [];
  if (thinkers.length === 0) return 0;

  const existing = await getEncountersByNotebook(notebookId);
  const known = new Set(existing.map((e) => e.thinker.toLowerCase()));
  let added = 0;

  for (const t of thinkers as Array<Record<string, string>>) {
    if (!t.name || known.has(t.name.toLowerCase())) continue;
    await createEncounter({
      studentId, notebookId,
      ref: `T${existing.length + added + 1}`,
      thinker: t.name,
      tradition: t.tradition ?? '',
      coreIdea: t.coreIdea ?? '',
      sessionTopic,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
      status: 'active',
    });
    added++;
  }

  if (added > 0) notify(Store.Encounters);
  return added;
}

// ─── Vocabulary Extractor (MINIMAL context) ──────────────────────────

const VOCAB_EXTRACTOR = micro(
  `Extract technical vocabulary from this text. Only include domain-specific terms a student would need to learn. Max 3.`,
  vocabExtractionSchema,
);

export async function extractVocabulary(
  text: string,
  studentId: string,
  notebookId: string,
): Promise<number> {
  const result = await runTextAgent(VOCAB_EXTRACTOR, [{
    role: 'user', parts: [{ text }],
  }]);

  const parsed = parseJson(result.text);
  const terms = Array.isArray(parsed?.terms) ? parsed.terms : [];
  if (terms.length === 0) return 0;

  const existing = await getLexiconByNotebook(notebookId);
  const known = new Set(existing.map((e) => e.term.toLowerCase()));
  let added = 0;

  for (const t of terms as Array<Record<string, string>>) {
    if (!t.term || known.has(t.term.toLowerCase())) continue;
    await createLexiconEntry({
      studentId, notebookId,
      number: existing.length + added + 1,
      term: t.term,
      pronunciation: '',
      definition: t.definition ?? '',
      level: 'exploring',
      percentage: 10,
      etymology: t.etymology ?? '',
      crossReferences: [],
    });
    added++;
  }

  if (added > 0) notify(Store.Lexicon);
  return added;
}

// ─── Mastery Updater (FOCUSED context — needs existing mastery) ──────

const MASTERY_UPDATER = micro(
  `Given a student's entry and existing mastery levels, assess if any concept's mastery changed. Only include concepts where mastery CHANGED based on what the student demonstrated.`,
  masteryUpdateSchema,
);

export async function updateMasteryFromEntry(
  studentText: string,
  existingMastery: string,
  studentId: string,
  notebookId: string,
): Promise<number> {
  const result = await runTextAgent(MASTERY_UPDATER, [{
    role: 'user',
    parts: [{
      text: `Student wrote: "${studentText}"\n\nExisting mastery:\n${existingMastery}`,
    }],
  }]);

  const parsed = parseJson(result.text);
  const updates = Array.isArray(parsed?.updates) ? parsed.updates : [];
  let count = 0;

  for (const u of updates as Array<Record<string, unknown>>) {
    if (!u.concept || !u.level) continue;
    const level = u.level as 'exploring' | 'developing' | 'strong' | 'mastered';
    const percentage = typeof u.percentage === 'number' ? u.percentage : 10;
    await upsertMastery({
      studentId, notebookId,
      concept: String(u.concept),
      level, percentage,
    });
    count++;
  }

  if (count > 0) notify(Store.Mastery);
  return count;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                  text.match(/(\{[\s\S]*\})/);
    if (!match?.[1]) return null;
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseSignals(text: string): TaskSignals {
  const parsed = parseJson(text);
  if (!parsed) return noTasks();
  return {
    updateThinkers: Boolean(parsed.updateThinkers),
    updateVocabulary: Boolean(parsed.updateVocabulary),
    updateMastery: Boolean(parsed.updateMastery),
    updateCuriosities: Boolean(parsed.updateCuriosities),
  };
}
