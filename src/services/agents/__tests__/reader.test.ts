import { describe, it, expect } from 'vitest';
import { READER_AGENT } from '../reader';

describe('agents/reader', () => {
  it('has correct name', () => {
    expect(READER_AGENT.name).toBe('Reader');
  });

  it('uses light model', () => {
    expect(READER_AGENT.model).toContain('flash-lite');
  });

  it('uses MINIMAL thinking', () => {
    expect(READER_AGENT.thinkingLevel).toBe('MINIMAL');
  });

  it('has no tools', () => {
    expect(READER_AGENT.tools).toEqual([]);
  });

  it('instruction handles multiple image types', () => {
    const instruction = READER_AGENT.systemInstruction;
    expect(instruction).toContain('diagram');
    expect(instruction).toContain('sketch');
    expect(instruction).toContain('formula');
  });

  it('responds in tutor format', () => {
    expect(READER_AGENT.systemInstruction).toContain('tutor-marginalia');
    expect(READER_AGENT.systemInstruction).toContain('tutor-question');
  });
});
