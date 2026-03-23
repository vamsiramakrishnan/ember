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

/** What the routing decision expects from the change. */
export interface ChangeContract {
  /** Was research invoked? Critic should verify facts. */
  researchGrounded?: boolean;
  /** Were thinkers referenced? Critic should verify names/dates. */
  thinkersMentioned?: string[];
  /** Were concepts mapped? Critic should verify relationships. */
  conceptsMapped?: string[];
  /** URL sources to verify against. */
  sourceUrls?: string[];
}

export interface RefinementResult {
  html: string;
  iterations: number;
  finalScore: number;
}

/**
 * Refine an HTML artifact through iterative critique→patch cycles.
 * The critic uses Google Search + URL context for factual grounding.
 * The change contract tells the critic what to specifically verify.
 */
export async function refineArtifact(
  html: string,
  originalPrompt: string,
  context?: string,
  contract?: ChangeContract,
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

    const critique = await evaluateArtifact(currentHtml, originalPrompt, context, contract);
    finalScore = critique.score;

    if (critique.score >= QUALITY_THRESHOLD || critique.patches.length === 0) break;
    currentHtml = applyPatches(currentHtml, critique.patches);
  }

  return { html: currentHtml, iterations, finalScore };
}

async function evaluateArtifact(
  html: string, prompt: string, context?: string, contract?: ChangeContract,
): Promise<CritiqueResult> {
  try {
    const contractHints = buildContractHints(contract);
    const critiquePrompt = [
      `Original request: "${prompt}"`,
      context ? `Context: ${context}` : '',
      contractHints,
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

/** Build critique hints from the change contract. */
function buildContractHints(contract?: ChangeContract): string {
  if (!contract) return '';
  const hints: string[] = ['VERIFICATION CONTRACT:'];
  if (contract.researchGrounded) {
    hints.push('- This artifact was research-grounded. Verify ALL dates, names, and factual claims via Google Search.');
  }
  if (contract.thinkersMentioned?.length) {
    hints.push(`- Thinkers referenced: ${contract.thinkersMentioned.join(', ')}. Verify attributions and quotes.`);
  }
  if (contract.conceptsMapped?.length) {
    hints.push(`- Concepts mapped: ${contract.conceptsMapped.join(', ')}. Verify relationships are accurate.`);
  }
  if (contract.sourceUrls?.length) {
    hints.push(`- Source URLs to check: ${contract.sourceUrls.join(', ')}. Use URL context to verify content matches.`);
  }
  return hints.length > 1 ? hints.join('\n') : '';
}
