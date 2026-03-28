import { describe, it, expect } from 'vitest';
import { TUTOR_AGENT } from '../tutor';

describe('agents/tutor', () => {
  it('has correct name', () => {
    expect(TUTOR_AGENT.name).toBe('Tutor');
  });

  it('uses light model for low latency', () => {
    expect(TUTOR_AGENT.model).toContain('flash-lite');
  });

  it('uses MINIMAL thinking for speed', () => {
    expect(TUTOR_AGENT.thinkingLevel).toBe('MINIMAL');
  });

  it('includes Google Search tool', () => {
    expect(TUTOR_AGENT.tools).toHaveLength(1);
    expect(TUTOR_AGENT.tools[0]).toHaveProperty('googleSearch');
  });

  it('has response schema for structured output', () => {
    expect(TUTOR_AGENT.responseSchema).toBeDefined();
  });

  it('system instruction contains Socratic voice rules', () => {
    expect(TUTOR_AGENT.systemInstruction).toContain('Socratic');
  });

  it('system instruction forbids exclamation marks', () => {
    expect(TUTOR_AGENT.systemInstruction).toContain('exclamation');
  });

  it('system instruction contains response format', () => {
    expect(TUTOR_AGENT.systemInstruction).toContain('tutor-marginalia');
    expect(TUTOR_AGENT.systemInstruction).toContain('tutor-question');
    expect(TUTOR_AGENT.systemInstruction).toContain('tutor-connection');
    expect(TUTOR_AGENT.systemInstruction).toContain('tutor-directive');
  });

  it('system instruction includes concept-diagram format', () => {
    expect(TUTOR_AGENT.systemInstruction).toContain('concept-diagram');
    expect(TUTOR_AGENT.systemInstruction).toContain('thinker-card');
  });

  it('uses TEXT response modality', () => {
    expect(TUTOR_AGENT.responseModalities).toEqual(['TEXT']);
  });
});
