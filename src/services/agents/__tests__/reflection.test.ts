import { describe, it, expect } from 'vitest';
import { REFLECTION_AGENT } from '../reflection';

describe('agents/reflection', () => {
  it('has correct name', () => {
    expect(REFLECTION_AGENT.name).toBe('Reflection');
  });

  it('uses light model', () => {
    expect(REFLECTION_AGENT.model).toContain('flash-lite');
  });

  it('uses LOW thinking (more than MINIMAL for synthesis)', () => {
    expect(REFLECTION_AGENT.thinkingLevel).toBe('LOW');
  });

  it('has no tools', () => {
    expect(REFLECTION_AGENT.tools).toEqual([]);
  });

  it('has response schema', () => {
    expect(REFLECTION_AGENT.responseSchema).toBeDefined();
  });

  it('instruction emphasizes recognition not summary', () => {
    expect(REFLECTION_AGENT.systemInstruction).toContain('not summarized');
    expect(REFLECTION_AGENT.systemInstruction).toContain('Name the pattern');
  });

  it('instruction forbids praise words', () => {
    expect(REFLECTION_AGENT.systemInstruction).toContain('Never use praise');
  });
});
