/**
 * Tests for context-formatter.ts — formats KG data into prompt text.
 */
import { describe, it, expect } from 'vitest';
import { formatContext, type FormattableContext } from '../context-formatter';

function makeCtx(overrides: Partial<FormattableContext> = {}): FormattableContext {
  return {
    activeConcepts: [],
    nearbyGaps: [],
    openThreads: [],
    unbridgedThinkers: [],
    ...overrides,
  };
}

describe('formatContext — narrative', () => {
  it('returns empty string for empty context', () => {
    expect(formatContext(makeCtx(), 'narrative')).toBe('');
  });

  it('includes session summary', () => {
    const result = formatContext(makeCtx({ sessionSummary: 'Studying gravity' }), 'narrative');
    expect(result).toContain('Studying gravity');
  });

  it('describes active concepts', () => {
    const ctx = makeCtx({
      activeConcepts: [{ concept: 'Gravity', level: 'strong', percentage: 80, connections: 3 }],
    });
    expect(formatContext(ctx, 'narrative')).toContain('Gravity');
    expect(formatContext(ctx, 'narrative')).toContain('exploring');
  });

  it('describes nearby gaps', () => {
    const ctx = makeCtx({
      nearbyGaps: [{ concept: 'Orbits', percentage: 30, reason: 'weak understanding' }],
    });
    const result = formatContext(ctx, 'narrative');
    expect(result).toContain('Orbits');
    expect(result).toContain('30%');
  });

  it('describes open threads', () => {
    const ctx = makeCtx({ openThreads: ['Why does gravity exist?'] });
    const result = formatContext(ctx, 'narrative');
    expect(result).toContain('Why does gravity exist?');
  });

  it('describes unbridged thinkers', () => {
    const ctx = makeCtx({
      unbridgedThinkers: [{ name: 'Euler', coreIdea: 'Graph theory' }],
    });
    const result = formatContext(ctx, 'narrative');
    expect(result).toContain('Euler');
    expect(result).toContain('Graph theory');
  });
});

describe('formatContext — bulleted', () => {
  it('returns empty string for empty context', () => {
    expect(formatContext(makeCtx(), 'bulleted')).toBe('');
  });

  it('formats active concepts as bullets', () => {
    const ctx = makeCtx({
      activeConcepts: [{ concept: 'Gravity', level: 'strong', percentage: 80, connections: 3 }],
    });
    const result = formatContext(ctx, 'bulleted');
    expect(result).toContain('- Gravity');
    expect(result).toContain('80%');
  });

  it('includes mastery section', () => {
    const ctx = makeCtx({
      mastery: [{ concept: 'Orbits', level: 'developing', percentage: 45 }],
    });
    const result = formatContext(ctx, 'bulleted');
    expect(result).toContain('Student mastery');
    expect(result).toContain('Orbits: developing (45%)');
  });

  it('formats learning gaps', () => {
    const ctx = makeCtx({
      nearbyGaps: [{ concept: 'Entropy', percentage: 20, reason: 'rarely encountered' }],
    });
    const result = formatContext(ctx, 'bulleted');
    expect(result).toContain('Learning gaps');
    expect(result).toContain('Entropy');
  });
});

describe('formatContext — structured', () => {
  it('starts with tagged header', () => {
    const result = formatContext(makeCtx(), 'structured');
    expect(result).toContain('[KNOWLEDGE GRAPH');
  });

  it('formats active concepts with indentation', () => {
    const ctx = makeCtx({
      activeConcepts: [{ concept: 'Light', level: 'exploring', percentage: 10, connections: 1 }],
    });
    const result = formatContext(ctx, 'structured');
    expect(result).toContain('  Light: exploring (10%)');
  });

  it('formats open questions', () => {
    const ctx = makeCtx({ openThreads: ['What is light?'] });
    const result = formatContext(ctx, 'structured');
    expect(result).toContain('"What is light?"');
  });

  it('includes all sections when present', () => {
    const ctx = makeCtx({
      sessionSummary: 'S',
      activeConcepts: [{ concept: 'A', level: 'l', percentage: 1, connections: 0 }],
      nearbyGaps: [{ concept: 'B', percentage: 2, reason: 'r' }],
      openThreads: ['Q'],
      unbridgedThinkers: [{ name: 'T', coreIdea: 'I' }],
    });
    const result = formatContext(ctx, 'structured');
    expect(result).toContain('Session: S');
    expect(result).toContain('Active concepts');
    expect(result).toContain('Learning gaps');
    expect(result).toContain('Open questions');
    expect(result).toContain('Unbridged thinkers');
  });
});
