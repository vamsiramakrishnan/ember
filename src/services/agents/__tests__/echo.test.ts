import { describe, it, expect } from 'vitest';
import { ECHO_AGENT } from '../echo';

describe('agents/echo', () => {
  it('has correct name', () => {
    expect(ECHO_AGENT.name).toBe('Echo');
  });

  it('uses light model', () => {
    expect(ECHO_AGENT.model).toContain('flash-lite');
  });

  it('uses MINIMAL thinking', () => {
    expect(ECHO_AGENT.thinkingLevel).toBe('MINIMAL');
  });

  it('has no tools', () => {
    expect(ECHO_AGENT.tools).toEqual([]);
  });

  it('has response schema', () => {
    expect(ECHO_AGENT.responseSchema).toBeDefined();
  });

  it('instruction mentions paraphrasing rule', () => {
    expect(ECHO_AGENT.systemInstruction).toContain('never quote it exactly');
  });

  it('instruction mentions skip option', () => {
    expect(ECHO_AGENT.systemInstruction).toContain('skip');
  });
});
