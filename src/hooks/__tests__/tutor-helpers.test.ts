/**
 * Tests for tutor-helpers — delay, inferTutorMode, extractTopics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { delay, inferTutorMode, extractTopics } from '../tutor-helpers';
import type { NotebookEntry } from '@/types/entries';

describe('delay', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('resolves after specified ms', async () => {
    const p = delay(500);
    vi.advanceTimersByTime(500);
    await expect(p).resolves.toBeUndefined();
  });

  it('does not resolve early', async () => {
    let resolved = false;
    delay(1000).then(() => { resolved = true; });
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    expect(resolved).toBe(false);
    vi.advanceTimersByTime(500);
    await Promise.resolve();
  });
});

describe('inferTutorMode', () => {
  it('returns socratic for tutor-question', () => {
    expect(inferTutorMode({ type: 'tutor-question', content: 'Why?' })).toBe('socratic');
  });

  it('returns connection for tutor-connection', () => {
    expect(inferTutorMode({ type: 'tutor-connection', content: 'Links to...', emphasisEnd: 5 })).toBe('connection');
  });

  it('returns visual for concept-diagram', () => {
    expect(inferTutorMode({ type: 'concept-diagram', items: [] })).toBe('visual');
  });

  it('returns visual for visualization', () => {
    expect(inferTutorMode({ type: 'visualization', html: '<div/>' } as NotebookEntry)).toBe('visual');
  });

  it('returns silence for silence', () => {
    expect(inferTutorMode({ type: 'silence' })).toBe('silence');
  });

  it('returns confirmation as default', () => {
    expect(inferTutorMode({ type: 'tutor-marginalia', content: 'Good job' })).toBe('confirmation');
    expect(inferTutorMode({ type: 'prose', content: 'text' })).toBe('confirmation');
  });
});

describe('extractTopics', () => {
  it('extracts capitalized words from content', () => {
    const entry: NotebookEntry = {
      type: 'tutor-marginalia',
      content: 'This relates to Kepler and Newton third law',
    };
    const topics = extractTopics(entry);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.some(t => t.includes('Kepler') || t.includes('Newton'))).toBe(true);
  });

  it('returns empty array for entries without content', () => {
    expect(extractTopics({ type: 'silence' })).toEqual([]);
    expect(extractTopics({ type: 'concept-diagram', items: [] })).toEqual([]);
  });

  it('limits to 3 topics', () => {
    const entry: NotebookEntry = {
      type: 'tutor-marginalia',
      content: 'About Kepler and Newton and Euler and Gauss and Riemann',
    };
    expect(extractTopics(entry).length).toBeLessThanOrEqual(3);
  });
});
