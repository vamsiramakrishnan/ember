import { describe, it, expect } from 'vitest';
import { IMAGE_CRITIC_AGENT } from '../image-critic';

describe('agents/image-critic', () => {
  it('has correct name', () => {
    expect(IMAGE_CRITIC_AGENT.name).toBe('ImageCritic');
  });

  it('uses heavy model', () => {
    expect(IMAGE_CRITIC_AGENT.model).toContain('3-flash');
  });

  it('uses HIGH thinking', () => {
    expect(IMAGE_CRITIC_AGENT.thinkingLevel).toBe('HIGH');
  });

  it('includes Google Search tool', () => {
    expect(IMAGE_CRITIC_AGENT.tools).toHaveLength(1);
  });

  it('has max turns of 3', () => {
    expect(IMAGE_CRITIC_AGENT.maxTurns).toBe(3);
  });

  it('has 20s time limit', () => {
    expect(IMAGE_CRITIC_AGENT.maxTimeMs).toBe(20_000);
  });

  it('is search-only constrained', () => {
    expect(IMAGE_CRITIC_AGENT.constraint).toBe('search-only');
  });

  it('instruction mentions score and editInstructions', () => {
    expect(IMAGE_CRITIC_AGENT.systemInstruction).toContain('score');
    expect(IMAGE_CRITIC_AGENT.systemInstruction).toContain('editInstructions');
  });

  it('instruction evaluates Ember aesthetic', () => {
    expect(IMAGE_CRITIC_AGENT.systemInstruction).toContain('EMBER AESTHETIC');
  });
});
