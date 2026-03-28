import { describe, it, expect } from 'vitest';
import { CONTENT_CRITIC_AGENT } from '../content-critic';

describe('agents/content-critic', () => {
  it('has correct name', () => {
    expect(CONTENT_CRITIC_AGENT.name).toBe('ContentCritic');
  });

  it('uses heavy model', () => {
    expect(CONTENT_CRITIC_AGENT.model).toContain('3-flash');
  });

  it('uses HIGH thinking', () => {
    expect(CONTENT_CRITIC_AGENT.thinkingLevel).toBe('HIGH');
  });

  it('includes Google Search tool', () => {
    expect(CONTENT_CRITIC_AGENT.tools).toHaveLength(1);
    expect(CONTENT_CRITIC_AGENT.tools[0]).toHaveProperty('googleSearch');
  });

  it('has max turns of 2', () => {
    expect(CONTENT_CRITIC_AGENT.maxTurns).toBe(2);
  });

  it('has 15s time limit', () => {
    expect(CONTENT_CRITIC_AGENT.maxTimeMs).toBe(15_000);
  });

  it('is search-only constrained', () => {
    expect(CONTENT_CRITIC_AGENT.constraint).toBe('search-only');
  });

  it('system instruction mentions corrections format', () => {
    expect(CONTENT_CRITIC_AGENT.systemInstruction).toContain('corrections');
    expect(CONTENT_CRITIC_AGENT.systemInstruction).toContain('score');
  });
});
