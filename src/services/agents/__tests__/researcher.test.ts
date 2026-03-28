import { describe, it, expect } from 'vitest';
import { RESEARCHER_AGENT } from '../researcher';

describe('agents/researcher', () => {
  it('has correct name', () => {
    expect(RESEARCHER_AGENT.name).toBe('Researcher');
  });

  it('uses heavy model', () => {
    expect(RESEARCHER_AGENT.model).toContain('3-flash');
  });

  it('uses HIGH thinking', () => {
    expect(RESEARCHER_AGENT.thinkingLevel).toBe('HIGH');
  });

  it('includes search and URL context tools', () => {
    expect(RESEARCHER_AGENT.tools).toHaveLength(2);
  });

  it('has max turns of 5', () => {
    expect(RESEARCHER_AGENT.maxTurns).toBe(5);
  });

  it('has 30s time limit', () => {
    expect(RESEARCHER_AGENT.maxTimeMs).toBe(30_000);
  });

  it('is search-only constrained', () => {
    expect(RESEARCHER_AGENT.constraint).toBe('search-only');
  });

  it('instruction mentions genuine bridges', () => {
    expect(RESEARCHER_AGENT.systemInstruction).toContain('genuine intellectual bridges');
  });
});
