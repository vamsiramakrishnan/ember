/** Content Refiner — iterative critique loop for structured teaching content.
 * Parallel to artifact-refiner.ts but operates on JSON entries.
 * The critic returns field-level corrections applied to entry arrays. */
import { CONTENT_CRITIC_AGENT } from './agents/content-critic';
import { resilientTextAgent } from './resilient-agent';
import { setActivityDetail } from '@/state';
import type { RefinementStep } from './patch-applier';
import type { NotebookEntry } from '@/types/entries';

const MAX_ITERATIONS = 2;
const QUALITY_THRESHOLD = 7;

interface Correction {
  index: number;
  field: string;
  value: unknown;
}

interface CritiqueResult {
  score: number;
  issues: string[];
  corrections: Correction[];
}

type ContentType = 'reading-material' | 'flashcard-deck' | 'exercise-set';

/** Describe the content shape so the critic knows what it's evaluating. */
const CONTENT_LABELS: Record<ContentType, { label: string; itemsKey: string }> = {
  'reading-material': { label: 'reading material slides', itemsKey: 'slides' },
  'flashcard-deck': { label: 'flashcard deck', itemsKey: 'cards' },
  'exercise-set': { label: 'exercise set', itemsKey: 'exercises' },
};

export interface ContentRefinementResult {
  entry: NotebookEntry;
  iterations: number;
  finalScore: number;
  history: RefinementStep[];
}

/** Refine a structured teaching entry through iterative critique. */
export async function refineContent(
  entry: NotebookEntry,
  originalPrompt: string,
  context?: string,
): Promise<ContentRefinementResult> {
  const cType = entry.type as ContentType;
  if (!CONTENT_LABELS[cType]) {
    return { entry, iterations: 0, finalScore: 10, history: [] };
  }

  let current = structuredClone(entry);
  let finalScore = 0;
  const history: RefinementStep[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    setActivityDetail({
      step: 'refining',
      label: i === 0 ? 'reviewing…' : `refining (pass ${i + 1})…`,
      iteration: i + 1,
      maxIterations: MAX_ITERATIONS,
    });

    const critique = await evaluateContent(current, cType, originalPrompt, context);
    finalScore = critique.score;
    history.push({
      iteration: i + 1,
      patchCount: critique.corrections.length,
      issues: critique.issues,
      score: critique.score,
    });

    if (critique.score >= QUALITY_THRESHOLD || critique.corrections.length === 0) break;
    current = applyCorrections(current, cType, critique.corrections);
  }

  return { entry: current, iterations: history.length, finalScore, history };
}

async function evaluateContent(
  entry: NotebookEntry, cType: ContentType,
  prompt: string, context?: string,
): Promise<CritiqueResult> {
  try {
    const meta = CONTENT_LABELS[cType];
    const items = getItems(entry, cType);
    const summary = JSON.stringify(items, null, 2).slice(0, 6000);

    const critiquePrompt = [
      `Content type: ${meta.label}`,
      `Original request: "${prompt}"`,
      context ? `Context: ${context}` : '',
      '',
      `Evaluate this ${meta.label} (${items.length} items):`,
      '```json', summary, '```', '',
      'Verify facts with Google Search. Return JSON: {score, issues, corrections}.',
      `Each correction: {index, field, value} targeting the ${meta.itemsKey} array.`,
    ].filter(Boolean).join('\n');

    const result = await resilientTextAgent(CONTENT_CRITIC_AGENT, [{
      role: 'user', parts: [{ text: critiquePrompt }],
    }]);
    return parseCritiqueResponse(result.text);
  } catch {
    return { score: 10, issues: [], corrections: [] };
  }
}

function parseCritiqueResponse(text: string): CritiqueResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { score: 10, issues: [], corrections: [] };
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 10,
      issues: Array.isArray(parsed.issues) ? parsed.issues as string[] : [],
      corrections: Array.isArray(parsed.corrections)
        ? (parsed.corrections as Correction[]).filter(
            (c) => typeof c.index === 'number' && typeof c.field === 'string' && c.value != null)
        : [],
    };
  } catch {
    return { score: 10, issues: [], corrections: [] };
  }
}

function getItems(entry: NotebookEntry, cType: ContentType): unknown[] {
  if (cType === 'reading-material' && entry.type === 'reading-material') return entry.slides;
  if (cType === 'flashcard-deck' && entry.type === 'flashcard-deck') return entry.cards;
  if (cType === 'exercise-set' && entry.type === 'exercise-set') return entry.exercises;
  return [];
}

function applyCorrections(
  entry: NotebookEntry, cType: ContentType, corrections: Correction[],
): NotebookEntry {
  const clone = structuredClone(entry);
  const items = getItems(clone, cType) as Record<string, unknown>[];

  for (const c of corrections) {
    const item = items[c.index];
    if (item && c.field in item) {
      item[c.field] = c.value;
    }
  }

  return clone;
}
