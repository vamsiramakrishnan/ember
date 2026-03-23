/**
 * Artifact Refiner — iterative critique→patch loop for rich content.
 *
 * Uses a SEARCH/REPLACE diff format (inspired by aider) so the refinement
 * agent patches targeted sections instead of regenerating entire artifacts.
 *
 * Pipeline per iteration:
 * 1. Critic evaluates the artifact (grounded with Search + URL context)
 * 2. If quality passes threshold → done
 * 3. If not → Refiner produces SEARCH/REPLACE blocks
 * 4. Patches applied → next iteration
 *
 * Status updates propagated via setActivityDetail for the TutorActivity UI.
 */
import { CRITIC_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import { setActivityDetail } from '@/state';
import type { TutorActivityDetail } from '@/state';

const MAX_ITERATIONS = 3;
const QUALITY_THRESHOLD = 7;

interface SearchReplaceBlock { search: string; replace: string }
interface CritiqueResult { score: number; issues: string[]; patches: SearchReplaceBlock[] }

export interface RefinementResult {
  html: string;
  iterations: number;
  finalScore: number;
}

/**
 * Refine an HTML artifact through iterative critique→patch cycles.
 * The critic uses Google Search + URL context for factual grounding.
 */
export async function refineArtifact(
  html: string,
  originalPrompt: string,
  context?: string,
): Promise<RefinementResult> {
  let currentHtml = html;
  let finalScore = 0;
  let iterations = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;
    const detail: TutorActivityDetail = {
      step: 'refining',
      label: i === 0 ? 'reviewing…' : `refining (pass ${i + 1})…`,
      iteration: i + 1,
      maxIterations: MAX_ITERATIONS,
    };
    setActivityDetail(detail);

    const critique = await evaluateArtifact(currentHtml, originalPrompt, context);
    finalScore = critique.score;

    if (critique.score >= QUALITY_THRESHOLD || critique.patches.length === 0) break;
    currentHtml = applyPatches(currentHtml, critique.patches);
  }

  return { html: currentHtml, iterations, finalScore };
}

async function evaluateArtifact(
  html: string, prompt: string, context?: string,
): Promise<CritiqueResult> {
  try {
    const critiquePrompt = [
      `Original request: "${prompt}"`,
      context ? `Context: ${context}` : '',
      '', 'Evaluate this HTML visualization:', '```html',
      html.slice(0, 8000), '```', '',
      'Check facts with Google Search. Return JSON with score, issues, and patches.',
    ].filter(Boolean).join('\n');

    const result = await runTextAgent(CRITIC_AGENT, [{
      role: 'user', parts: [{ text: critiquePrompt }],
    }]);
    return parseCritiqueResponse(result.text);
  } catch {
    return { score: 10, issues: [], patches: [] };
  }
}

function parseCritiqueResponse(text: string): CritiqueResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { score: 10, issues: [], patches: [] };
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 10,
      issues: Array.isArray(parsed.issues) ? parsed.issues as string[] : [],
      patches: Array.isArray(parsed.patches)
        ? (parsed.patches as Array<{ search?: unknown; replace?: unknown }>)
            .filter((p): p is { search: string; replace: string } =>
              typeof p.search === 'string' && typeof p.replace === 'string')
        : [],
    };
  } catch {
    return { score: 10, issues: [], patches: [] };
  }
}

function applyPatches(html: string, patches: SearchReplaceBlock[]): string {
  let result = html;
  for (const patch of patches) {
    if (patch.search && result.includes(patch.search)) {
      result = result.replace(patch.search, patch.replace);
    }
  }
  return result;
}
