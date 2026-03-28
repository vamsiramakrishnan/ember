/**
 * Content Deepener — universal "make it richer" operation.
 *
 * Analyzes any notebook entry, determines what enrichment it needs,
 * builds a mini-DAG of enrichment steps, and executes them with
 * callbacks as each piece arrives (the podcast looping pattern).
 *
 * The pattern:
 *   analyze(entry) → DeepPlan (what's missing)
 *   execute(plan)  → patch entry in-place as enrichments arrive
 *
 * Works for: reading-material, flashcard-deck, exercise-set,
 * tutor-marginalia, concept-diagram, or any entry with content.
 */
import { isGeminiAvailable } from './gemini';
import { generateIllustration, generateVisualization } from './enrichment';
import type { NotebookEntry } from '@/types/entries';

/** What the analyzer determines is missing. */
export interface DeepPlan {
  /** Slides that need illustrations. */
  slidesNeedingImages: number[];
  /** Whether to generate a visualization. */
  needsVisualization: boolean;
  /** Whether to expand with more content. */
  needsExpansion: boolean;
  /** Summary of what the deepener will do. */
  summary: string;
}

export type DeepCallback = (
  update: { type: 'slide-image'; index: number; imageUrl: string }
       | { type: 'visualization'; html: string }
       | { type: 'expanded'; entries: NotebookEntry[] }
       | { type: 'status'; label: string },
) => void;

/** Analyze an entry and determine what enrichment it needs. */
export function analyzeDeepeningNeeds(entry: NotebookEntry): DeepPlan {
  const plan: DeepPlan = {
    slidesNeedingImages: [],
    needsVisualization: false,
    needsExpansion: false,
    summary: '',
  };

  if (entry.type === 'reading-material') {
    const slides = entry.slides;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]!;
      if (!s.imageUrl && (s.layout === 'content' || s.layout === 'two-column' || s.layout === 'diagram')) {
        plan.slidesNeedingImages.push(i);
      }
    }
    if (slides.length < 8) plan.needsExpansion = true;
    const parts: string[] = [];
    if (plan.slidesNeedingImages.length > 0) parts.push(`illustrate ${plan.slidesNeedingImages.length} slides`);
    if (plan.needsExpansion) parts.push('expand content');
    plan.summary = parts.join(', ') || 'already rich';
    return plan;
  }

  if (entry.type === 'flashcard-deck') {
    for (let i = 0; i < entry.cards.length; i++) {
      if (!entry.cards[i]!.imageUrl) plan.slidesNeedingImages.push(i);
    }
    plan.summary = plan.slidesNeedingImages.length > 0
      ? `illustrate ${plan.slidesNeedingImages.length} cards` : 'already rich';
    return plan;
  }

  if ('content' in entry && typeof entry.content === 'string') {
    plan.needsVisualization = entry.content.length > 200;
    plan.needsExpansion = entry.content.length < 300;
    const parts: string[] = [];
    if (plan.needsVisualization) parts.push('create visualization');
    if (plan.needsExpansion) parts.push('expand content');
    plan.summary = parts.join(', ') || 'already rich';
  }

  return plan;
}

/**
 * Execute a deep plan — the podcast looping pattern.
 * Calls onUpdate as each enrichment completes (images arrive one by one).
 */
export async function executeDeepening(
  entry: NotebookEntry,
  plan: DeepPlan,
  onUpdate: DeepCallback,
): Promise<void> {
  if (!isGeminiAvailable()) return;

  const tasks: Promise<void>[] = [];

  // Slide/card illustrations — fire all in parallel, callback per image
  if (plan.slidesNeedingImages.length > 0) {
    for (const idx of plan.slidesNeedingImages) {
      tasks.push((async () => {
        const prompt = getSlidePrompt(entry, idx);
        onUpdate({ type: 'status', label: `illustrating slide ${idx + 1}` });
        const result = await generateIllustration(prompt, []);
        if (result && result.type === 'illustration') {
          onUpdate({ type: 'slide-image', index: idx, imageUrl: result.dataUrl });
        }
      })().catch((err) => console.error(`[Deepen] Slide ${idx}:`, err)));
    }
  }

  // Visualization for prose entries
  if (plan.needsVisualization && 'content' in entry) {
    tasks.push((async () => {
      onUpdate({ type: 'status', label: 'creating visualization' });
      const content = (entry as { content: string }).content;
      const result = await generateVisualization(content, []);
      if (result && result.type === 'visualization') {
        onUpdate({ type: 'visualization', html: result.html });
      }
    })().catch((err) => console.error('[Deepen] Visualization:', err)));
  }

  if (tasks.length > 0) await Promise.allSettled(tasks);
}

function getSlidePrompt(entry: NotebookEntry, index: number): string {
  if (entry.type === 'reading-material') {
    const slide = entry.slides[index];
    return slide ? `Concept illustration for: ${slide.heading}. ${slide.body.slice(0, 200)}` : '';
  }
  if (entry.type === 'flashcard-deck') {
    const card = entry.cards[index];
    return card ? `Visual mnemonic for: ${card.front}` : '';
  }
  return '';
}
