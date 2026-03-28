/**
 * Slide Enrichment — generates per-slide AI illustrations.
 * Targets visual-heavy layouts (diagram, timeline, two-column, content).
 * Fire-and-forget: calls onSlideEnriched as each illustration completes.
 */
import { generateInlineSketch } from './visual-generation';
import type { ReadingSlide } from '@/types/entries';

/** Layouts that benefit from inline illustrations. */
const VISUAL_LAYOUTS = new Set(['diagram', 'timeline', 'two-column', 'content']);

/**
 * Enrich slides with AI-generated inline illustrations.
 * Max 4 illustrations per deck to keep generation fast.
 */
export async function enrichSlideVisuals(
  slides: ReadingSlide[],
  topic: string,
  onSlideEnriched: (index: number, imageUrl: string) => void,
): Promise<void> {
  const targets = slides
    .map((s, i) => ({ slide: s, index: i }))
    .filter(({ slide }) => !slide.imageUrl && VISUAL_LAYOUTS.has(slide.layout))
    .slice(0, 4);

  await Promise.allSettled(
    targets.map(async ({ slide, index }) => {
      const desc = `${slide.heading}: ${slide.body.slice(0, 120)}`;
      const url = await generateInlineSketch(
        `A concept illustration for a teaching slide about ${topic}. ` +
        `The slide is titled "${slide.heading}" and covers: ${desc}`,
      );
      if (url) onSlideEnriched(index, url);
    }),
  );
}
