import { describe, it, expect } from 'vitest';
import { VISUALISER_AGENT } from '../visualiser';

describe('agents/visualiser', () => {
  it('has correct name', () => {
    expect(VISUALISER_AGENT.name).toBe('Visualiser');
  });

  it('uses heavy model for quality output', () => {
    expect(VISUALISER_AGENT.model).toContain('3-flash');
  });

  it('uses HIGH thinking', () => {
    expect(VISUALISER_AGENT.thinkingLevel).toBe('HIGH');
  });

  it('includes Google Search tool', () => {
    expect(VISUALISER_AGENT.tools).toHaveLength(1);
  });

  it('has max turns of 5', () => {
    expect(VISUALISER_AGENT.maxTurns).toBe(5);
  });

  it('has 45s time limit', () => {
    expect(VISUALISER_AGENT.maxTimeMs).toBe(45_000);
  });

  it('is search-only constrained', () => {
    expect(VISUALISER_AGENT.constraint).toBe('search-only');
  });

  it('instruction includes component library', () => {
    const instruction = VISUALISER_AGENT.systemInstruction;
    expect(instruction).toContain('ember-card');
    expect(instruction).toContain('ember-timeline');
    expect(instruction).toContain('ember-tabs');
    expect(instruction).toContain('ember-accordion');
  });

  it('instruction mentions design philosophy', () => {
    expect(VISUALISER_AGENT.systemInstruction).toContain('CREATE EXPERIENCES');
  });

  it('instruction forbids external resources', () => {
    expect(VISUALISER_AGENT.systemInstruction).toContain('No external images');
  });
});
