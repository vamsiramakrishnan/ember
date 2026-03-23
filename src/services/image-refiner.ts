/**
 * Image Refiner — iterative critique→edit loop for illustrations.
 * Uses Gemini's image+text→image capability for refinement.
 * Grace-period: final pass focuses on single most impactful fix.
 */
import { IMAGE_CRITIC_AGENT } from './agents/image-critic';
import { ILLUSTRATOR_AGENT } from './agents';
import { runTextAgent, runImageAgent } from './run-agent';
import { setActivityDetail } from '@/state';
import type { TutorActivityDetail } from '@/state';
import type { RefinementStep } from './patch-applier';

const MAX_ITERATIONS = 3;
const QUALITY_THRESHOLD = 7;

export interface ImageRefinementResult {
  imageData: string;
  mimeType: string;
  caption: string;
  iterations: number;
  finalScore: number;
  history: RefinementStep[];
}

interface ImageCritiqueResult {
  score: number;
  issues: string[];
  editInstructions: string;
}

/** Refine an illustration through iterative critique→edit cycles. */
export async function refineIllustration(
  imageData: string,
  mimeType: string,
  originalPrompt: string,
  caption: string,
): Promise<ImageRefinementResult> {
  let currentImage = imageData;
  let currentMime = mimeType;
  let finalScore = 0;
  const history: RefinementStep[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const detail: TutorActivityDetail = {
      step: 'refining',
      label: i === 0 ? 'reviewing sketch…' : `refining sketch (pass ${i + 1})…`,
      iteration: i + 1,
      maxIterations: MAX_ITERATIONS,
    };
    setActivityDetail(detail);

    const isLastPass = i === MAX_ITERATIONS - 1;
    const critique = await critiqueImage(
      currentImage, currentMime, originalPrompt, isLastPass,
    );
    finalScore = critique.score;
    history.push({
      iteration: i + 1,
      patchCount: critique.editInstructions ? 1 : 0,
      issues: critique.issues,
      score: critique.score,
    });

    if (critique.score >= QUALITY_THRESHOLD || !critique.editInstructions) break;

    const refined = await editImage(
      currentImage, currentMime, originalPrompt, critique.editInstructions,
    );
    if (!refined) break;

    currentImage = refined.data;
    currentMime = refined.mimeType;
  }

  return {
    imageData: currentImage,
    mimeType: currentMime,
    caption,
    iterations: history.length,
    finalScore,
    history,
  };
}

/** Send image to the critic agent for evaluation. */
async function critiqueImage(
  imageData: string, mimeType: string,
  prompt: string, isLastPass: boolean,
): Promise<ImageCritiqueResult> {
  try {
    const graceNote = isLastPass
      ? '\n\nThis is the FINAL review pass. Focus on the single most impactful improvement.'
      : '';

    const result = await runTextAgent(IMAGE_CRITIC_AGENT, [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: imageData } },
        { text: `Original request: "${prompt}"${graceNote}\n\nEvaluate this illustration.` },
      ],
    }]);
    return parseImageCritique(result.text);
  } catch {
    return { score: 10, issues: [], editInstructions: '' };
  }
}

/** Send image + edit instructions to the illustrator for refinement. */
async function editImage(
  imageData: string, mimeType: string,
  originalPrompt: string, editInstructions: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const result = await runImageAgent(ILLUSTRATOR_AGENT, [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: imageData } },
        { text: `Refine this illustration. Original concept: "${originalPrompt}"\n\nEdits needed:\n${editInstructions}\n\nKeep the same warm notebook style. Apply ONLY the requested changes.` },
      ],
    }]);

    const img = result.images[0];
    if (img) return { data: img.data, mimeType: img.mimeType };
  } catch {
    // Edit failed — return null to stop iteration
  }
  return null;
}

function parseImageCritique(text: string): ImageCritiqueResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { score: 10, issues: [], editInstructions: '' };
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 10,
      issues: Array.isArray(parsed.issues) ? parsed.issues as string[] : [],
      editInstructions: typeof parsed.editInstructions === 'string'
        ? parsed.editInstructions : '',
    };
  } catch {
    return { score: 10, issues: [], editInstructions: '' };
  }
}
