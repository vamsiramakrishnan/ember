/**
 * Exercise Generation — produces Socratic exercise sets.
 * No multiple choice. All exercises demand genuine reasoning.
 * Progressive hints allow the student to unstick themselves
 * without being handed the answer.
 */
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import type { NotebookEntry, LiveEntry, Exercise, ExerciseDifficulty } from '@/types/entries';

const SYSTEM_PROMPT = `You are Ember's tutor creating a set of Socratic exercises.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string — exercise set title",
  "exercises": [
    {
      "prompt": "string — the question or task (demanding, open-ended)",
      "approach": "string — what a good response would include (for evaluation, not shown)",
      "hints": ["string — progressive hints, gentle, not giving the answer"],
      "format": "open-response | explain | compare | apply | critique",
      "concept": "string — concept being tested (optional)"
    }
  ],
  "difficulty": "foundational | intermediate | advanced"
}

Rules:
- Generate 3-5 exercises per set
- Exercises MUST demand reasoning: explain why, compare how, apply to, critique this
- NO multiple choice, NO fill-in-the-blank, NO true/false
- Each exercise gets 2-3 progressive hints (nudge, don't tell)
- Order by difficulty within the set
- Format types: open-response (write freely), explain (articulate why),
  compare (contrast two things), apply (use in new context), critique (find limits)
- Difficulty: foundational (can define), intermediate (can explain relationships),
  advanced (can teach, critique, extend)`;

export async function generateExercises(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    const context = entries.slice(-6)
      .map((le) => 'content' in le.entry ? le.entry.content : '')
      .filter(Boolean).join('\n').slice(0, 600);

    const prompt = [
      `Create exercises about: ${topic}`,
      context ? `\nStudent's recent exploration:\n${context}` : '',
      '\nOutput JSON only.',
    ].join('');

    const result = await runTextAgent(VISUALISER_AGENT, [{
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
    }]);

    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(raw) as {
      title: string;
      exercises: Exercise[];
      difficulty: ExerciseDifficulty;
    };

    if (!parsed.title || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
      return null;
    }

    const exercises: Exercise[] = parsed.exercises.slice(0, 8).map((e) => ({
      prompt: String(e.prompt || ''),
      approach: String(e.approach || ''),
      hints: Array.isArray(e.hints) ? e.hints.map(String) : [],
      format: validateFormat(e.format),
      concept: e.concept ? String(e.concept) : undefined,
    }));

    const diff = validateDifficulty(parsed.difficulty);

    return {
      type: 'exercise-set', title: String(parsed.title), exercises, difficulty: diff,
    };
  } catch { /* not critical */ }
  return null;
}

const VALID_FORMATS = new Set(['open-response', 'explain', 'compare', 'apply', 'critique']);
const VALID_DIFFS = new Set(['foundational', 'intermediate', 'advanced']);

function validateFormat(v: unknown): Exercise['format'] {
  return VALID_FORMATS.has(v as string) ? v as Exercise['format'] : 'open-response';
}
function validateDifficulty(v: unknown): ExerciseDifficulty {
  return VALID_DIFFS.has(v as string) ? v as ExerciseDifficulty : 'intermediate';
}
