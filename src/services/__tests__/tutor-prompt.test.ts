/**
 * Tests for tutor-prompt.ts — system prompt constant.
 */
import { describe, it, expect } from 'vitest';
import { TUTOR_SYSTEM_PROMPT } from '../tutor-prompt';

describe('TUTOR_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof TUTOR_SYSTEM_PROMPT).toBe('string');
    expect(TUTOR_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('describes the tutor role', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('tutor');
    expect(TUTOR_SYSTEM_PROMPT).toContain('Ember');
  });

  it('specifies JSON response format', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('JSON');
    expect(TUTOR_SYSTEM_PROMPT).toContain('tutor-marginalia');
    expect(TUTOR_SYSTEM_PROMPT).toContain('tutor-question');
    expect(TUTOR_SYSTEM_PROMPT).toContain('tutor-connection');
    expect(TUTOR_SYSTEM_PROMPT).toContain('thinker-card');
    expect(TUTOR_SYSTEM_PROMPT).toContain('concept-diagram');
  });

  it('forbids gamified encouragement', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('emoji');
    expect(TUTOR_SYSTEM_PROMPT).toContain('badges');
  });
});
