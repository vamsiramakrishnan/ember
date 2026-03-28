import { describe, it, expect } from 'vitest';
import { CRITIC_AGENT } from '../critic';

describe('agents/critic', () => {
  it('has correct name', () => {
    expect(CRITIC_AGENT.name).toBe('Critic');
  });

  it('uses heavy model for careful analysis', () => {
    expect(CRITIC_AGENT.model).toContain('3-flash');
  });

  it('uses HIGH thinking', () => {
    expect(CRITIC_AGENT.thinkingLevel).toBe('HIGH');
  });

  it('includes Google Search and URL context tools', () => {
    expect(CRITIC_AGENT.tools).toHaveLength(2);
    expect(CRITIC_AGENT.tools.some((t) => 'googleSearch' in t)).toBe(true);
    expect(CRITIC_AGENT.tools.some((t) => 'urlContext' in t)).toBe(true);
  });

  it('has max turns limit', () => {
    expect(CRITIC_AGENT.maxTurns).toBe(3);
  });

  it('has time limit', () => {
    expect(CRITIC_AGENT.maxTimeMs).toBe(20_000);
  });

  it('is search-only constrained', () => {
    expect(CRITIC_AGENT.constraint).toBe('search-only');
  });

  it('system instruction mentions score and patches format', () => {
    expect(CRITIC_AGENT.systemInstruction).toContain('score');
    expect(CRITIC_AGENT.systemInstruction).toContain('patches');
  });
});
