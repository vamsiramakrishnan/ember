/**
 * Artifact Refiner — iterative critique→patch loop for rich content.
 *
 * Three matching strategies (inspired by aider's layered approach):
 * 1. Exact string match (fastest)
 * 2. Whitespace-normalized match (handles reformatting)
 * 3. DOM-selector match (CSS selector → innerHTML, most robust for HTML)
 *
 * The critic (architect) decides what to fix; the patch applier (editor)
 * applies it cheaply. Refinement history is preserved as pedagogically
 * meaningful steps showing how the artifact evolved.
 */
import { CRITIC_AGENT } from './agents';
import { resilientTextAgent } from './resilient-agent';
import { applyPatches, type Patch, type RefinementStep } from './patch-applier';
import { setActivityDetail } from '@/state';
import type { TutorActivityDetail } from '@/state';

const MAX_ITERATIONS = 3;
const QUALITY_THRESHOLD = 7;

export interface ChangeContract {
  researchGrounded?: boolean;
  thinkersMentioned?: string[];
  conceptsMapped?: string[];
  sourceUrls?: string[];
}

export interface RefinementResult {
  html: string;
  iterations: number;
  finalScore: number;
  /** Pedagogically meaningful: what changed at each step and why. */
  history: RefinementStep[];
}

export async function refineArtifact(
  html: string,
  originalPrompt: string,
  context?: string,
  contract?: ChangeContract,
): Promise<RefinementResult> {
  let currentHtml = html;
  let finalScore = 0;
  const history: RefinementStep[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const detail: TutorActivityDetail = {
      step: 'refining',
      label: i === 0 ? 'reviewing…' : `refining (pass ${i + 1})…`,
      iteration: i + 1,
      maxIterations: MAX_ITERATIONS,
    };
    setActivityDetail(detail);

    const isLastPass = i === MAX_ITERATIONS - 1;
    const critique = await evaluateArtifact(currentHtml, originalPrompt, context, contract, isLastPass);
    finalScore = critique.score;
    history.push({
      iteration: i + 1,
      patchCount: critique.patches.length,
      issues: critique.issues,
      score: critique.score,
    });

    if (critique.score >= QUALITY_THRESHOLD || critique.patches.length === 0) break;
    currentHtml = applyPatches(currentHtml, critique.patches);
  }

  return { html: currentHtml, iterations: history.length, finalScore, history };
}

interface CritiqueResult {
  score: number;
  issues: string[];
  patches: Patch[];
}

async function evaluateArtifact(
  html: string, prompt: string, context?: string,
  contract?: ChangeContract, isLastPass = false,
): Promise<CritiqueResult> {
  try {
    const contractHints = buildContractHints(contract);
    const graceNote = isLastPass
      ? '\n\nFINAL PASS: Focus on the single most impactful fix only.'
      : '';
    const critiquePrompt = [
      `Original request: "${prompt}"`,
      context ? `Context: ${context}` : '',
      contractHints,
      '', 'Evaluate this HTML visualization:', '```html',
      html.slice(0, 8000), '```', '',
      'Check facts with Google Search. Return JSON: {score, issues, patches}.',
      `Each patch: {search, replace} for exact match, or {selector, replace} for CSS selector.${graceNote}`,
    ].filter(Boolean).join('\n');

    const result = await resilientTextAgent(CRITIC_AGENT, [{
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
        ? (parsed.patches as Array<{ search?: unknown; replace?: unknown; selector?: unknown }>)
            .filter((p): p is Patch =>
              typeof p.replace === 'string' &&
              (typeof p.search === 'string' || typeof p.selector === 'string'))
        : [],
    };
  } catch {
    return { score: 10, issues: [], patches: [] };
  }
}

function buildContractHints(contract?: ChangeContract): string {
  if (!contract) return '';
  const h: string[] = ['VERIFICATION CONTRACT:'];
  if (contract.researchGrounded) {
    h.push('- Research-grounded: verify ALL dates, names, facts via Google Search.');
  }
  if (contract.thinkersMentioned?.length) {
    h.push(`- Thinkers: ${contract.thinkersMentioned.join(', ')}. Verify attributions.`);
  }
  if (contract.conceptsMapped?.length) {
    h.push(`- Concepts: ${contract.conceptsMapped.join(', ')}. Verify relationships.`);
  }
  if (contract.sourceUrls?.length) {
    h.push(`- Sources: ${contract.sourceUrls.join(', ')}. Use URL context to verify.`);
  }
  return h.length > 1 ? h.join('\n') : '';
}
