import { describe, it, expect } from 'vitest';
import { ANNOTATOR_AGENT } from '../annotator';

describe('agents/annotator', () => {
  it('has correct name', () => {
    expect(ANNOTATOR_AGENT.name).toBe('Annotator');
  });

  it('uses light model for background speed', () => {
    expect(ANNOTATOR_AGENT.model).toContain('flash-lite');
  });

  it('uses MINIMAL thinking', () => {
    expect(ANNOTATOR_AGENT.thinkingLevel).toBe('MINIMAL');
  });

  it('has no tools', () => {
    expect(ANNOTATOR_AGENT.tools).toEqual([]);
  });

  it('has response schema', () => {
    expect(ANNOTATOR_AGENT.responseSchema).toBeDefined();
  });

  it('instruction mentions annotation kinds', () => {
    const instruction = ANNOTATOR_AGENT.systemInstruction;
    expect(instruction).toContain('trivia');
    expect(instruction).toContain('connection');
    expect(instruction).toContain('question');
    expect(instruction).toContain('insight');
  });

  it('instruction limits to 2 annotations per entry', () => {
    expect(ANNOTATOR_AGENT.systemInstruction).toContain('Maximum 2');
  });
});
