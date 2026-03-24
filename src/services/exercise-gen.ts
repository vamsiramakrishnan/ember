/**
 * Exercise Generation — produces Socratic exercise sets.
 * Uses the shared structured-generator pipeline.
 */
import { generateStructured } from './structured-generator';
import { refineContent } from './content-refiner';
import type { NotebookEntry, LiveEntry, Exercise, ExerciseDifficulty } from '@/types/entries';

const VALID_FORMATS = new Set(['open-response', 'explain', 'compare', 'apply', 'critique']);
const VALID_DIFFS = new Set(['foundational', 'intermediate', 'advanced']);

interface RawSet {
  title: string;
  exercises: Exercise[];
  difficulty: ExerciseDifficulty;
}

export async function generateExercises(
  topic: string,
  entries: LiveEntry[],
  enrichedContext?: string,
): Promise<NotebookEntry | null> {
  const raw = await generateStructured<RawSet>(topic, entries, {
    systemPrompt: SYSTEM_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
        return null;
      }
      const exercises: Exercise[] = parsed.exercises.slice(0, 8).map((e) => ({
        prompt: String(e.prompt || ''),
        approach: String(e.approach || ''),
        hints: Array.isArray(e.hints) ? e.hints.map(String) : [],
        format: VALID_FORMATS.has(e.format) ? e.format : 'open-response',
        concept: e.concept ? String(e.concept) : undefined,
      }));
      const diff = VALID_DIFFS.has(parsed.difficulty) ? parsed.difficulty : 'intermediate';
      return { type: 'exercise-set', title: String(parsed.title), exercises, difficulty: diff };
    },
  }, enrichedContext);
  if (!raw) return null;
  const { entry: refined } = await refineContent(raw, topic, enrichedContext);
  return refined;
}

const SYSTEM_PROMPT = `You are Ember's tutor creating Socratic exercises.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string",
  "exercises": [{
    "prompt": "string (demanding, open-ended)",
    "approach": "string (for evaluation, not shown)",
    "hints": ["string (progressive, gentle)"],
    "format": "open-response | explain | compare | apply | critique",
    "concept": "string (optional)"
  }],
  "difficulty": "foundational | intermediate | advanced"
}

Rules:
- 3-5 exercises. NO multiple choice, NO fill-in-the-blank
- Each gets 2-3 progressive hints (nudge, don't tell)
- Order by difficulty within the set`;
