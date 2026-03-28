/**
 * Tests for content-deepener — analysis of entry enrichment needs.
 */
import { describe, test, expect, vi } from 'vitest';

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => false),
}));

vi.mock('../enrichment', () => ({
  generateIllustration: vi.fn(),
  generateVisualization: vi.fn(),
}));

import { analyzeDeepeningNeeds, executeDeepening } from '../content-deepener';
import type { NotebookEntry } from '@/types/entries';

describe('analyzeDeepeningNeeds', () => {
  test('identifies slides needing images in reading-material', () => {
    const entry = {
      type: 'reading-material' as const,
      title: 'Test',
      slides: [
        { heading: 'A', body: 'text', layout: 'content' as const },
        { heading: 'B', body: 'text', layout: 'content' as const, imageUrl: 'img.png' },
        { heading: 'C', body: 'text', layout: 'diagram' as const },
      ],
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.slidesNeedingImages).toEqual([0, 2]);
    expect(plan.summary).toContain('illustrate 2 slides');
  });

  test('identifies expansion needed for short reading material', () => {
    const entry = {
      type: 'reading-material' as const,
      title: 'Short',
      slides: Array.from({ length: 4 }, (_, i) => ({
        heading: `S${i}`, body: 'text', layout: 'title' as const,
      })),
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.needsExpansion).toBe(true);
  });

  test('no expansion needed for long reading material', () => {
    const entry = {
      type: 'reading-material' as const,
      title: 'Long',
      slides: Array.from({ length: 10 }, (_, i) => ({
        heading: `S${i}`, body: 'text', layout: 'title' as const,
      })),
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.needsExpansion).toBe(false);
  });

  test('identifies flashcard cards needing images', () => {
    const entry = {
      type: 'flashcard-deck' as const,
      title: 'Cards',
      cards: [
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2', imageUrl: 'img.png' },
      ],
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.slidesNeedingImages).toEqual([0]);
    expect(plan.summary).toContain('illustrate 1 cards');
  });

  test('identifies visualization needed for long prose content', () => {
    const entry = {
      type: 'tutor-marginalia' as const,
      content: 'x'.repeat(250),
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.needsVisualization).toBe(true);
  });

  test('identifies expansion needed for short prose content', () => {
    const entry = {
      type: 'tutor-marginalia' as const,
      content: 'short text',
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.needsExpansion).toBe(true);
  });

  test('returns "already rich" for fully-illustrated reading material', () => {
    const entry = {
      type: 'reading-material' as const,
      title: 'Full',
      slides: Array.from({ length: 10 }, (_, i) => ({
        heading: `S${i}`, body: 'text', layout: 'title' as const, imageUrl: 'img.png',
      })),
    } as NotebookEntry;

    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.summary).toBe('already rich');
  });

  test('returns default plan for unknown entry type', () => {
    const entry = { type: 'divider' } as NotebookEntry;
    const plan = analyzeDeepeningNeeds(entry);
    expect(plan.slidesNeedingImages).toEqual([]);
    expect(plan.needsVisualization).toBe(false);
    expect(plan.needsExpansion).toBe(false);
  });
});

describe('executeDeepening', () => {
  test('returns immediately when AI not available', async () => {
    const onUpdate = vi.fn();
    const entry = { type: 'divider' } as NotebookEntry;
    const plan = analyzeDeepeningNeeds(entry);
    await executeDeepening(entry, plan, onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
