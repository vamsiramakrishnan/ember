import { describe, it, expect } from 'vitest';
import { BOOTSTRAP_AGENT } from '../bootstrap';

describe('agents/bootstrap', () => {
  it('has correct name', () => {
    expect(BOOTSTRAP_AGENT.name).toBe('Bootstrap');
  });

  it('uses heavy model for quality research', () => {
    expect(BOOTSTRAP_AGENT.model).toContain('3-flash');
  });

  it('uses MEDIUM thinking', () => {
    expect(BOOTSTRAP_AGENT.thinkingLevel).toBe('MEDIUM');
  });

  it('includes Google Search and URL context tools', () => {
    expect(BOOTSTRAP_AGENT.tools).toHaveLength(2);
    expect(BOOTSTRAP_AGENT.tools.some((t) => 'googleSearch' in t)).toBe(true);
    expect(BOOTSTRAP_AGENT.tools.some((t) => 'urlContext' in t)).toBe(true);
  });

  it('has response schema for structured output', () => {
    expect(BOOTSTRAP_AGENT.responseSchema).toBeDefined();
  });

  it('instruction mentions seed material generation', () => {
    expect(BOOTSTRAP_AGENT.systemInstruction).toContain('thinkers');
    expect(BOOTSTRAP_AGENT.systemInstruction).toContain('vocabulary');
    expect(BOOTSTRAP_AGENT.systemInstruction).toContain('opening');
  });

  it('instruction emphasizes real scholarship', () => {
    expect(BOOTSTRAP_AGENT.systemInstruction).toContain('verifiable');
  });
});
