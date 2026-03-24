/**
 * Tests for token-context.ts — design token context strings for AI prompts.
 */
import { describe, it, expect } from 'vitest';
import {
  EMBER_COLOR_CONTEXT,
  EMBER_STYLE_CONTEXT,
  EMBER_DESIGN_CONTEXT,
} from '../token-context';

describe('EMBER_COLOR_CONTEXT', () => {
  it('is a non-empty string', () => {
    expect(EMBER_COLOR_CONTEXT.length).toBeGreaterThan(50);
  });

  it('includes paper color', () => {
    expect(EMBER_COLOR_CONTEXT).toContain('Paper:');
  });

  it('includes ink colors', () => {
    expect(EMBER_COLOR_CONTEXT).toContain('Ink:');
    expect(EMBER_COLOR_CONTEXT).toContain('Ink-soft:');
  });

  it('includes accent colors', () => {
    expect(EMBER_COLOR_CONTEXT).toContain('Sage:');
    expect(EMBER_COLOR_CONTEXT).toContain('Indigo:');
    expect(EMBER_COLOR_CONTEXT).toContain('Amber:');
  });

  it('mentions no pure black or white', () => {
    expect(EMBER_COLOR_CONTEXT).toContain('No pure black or white');
  });
});

describe('EMBER_STYLE_CONTEXT', () => {
  it('includes font references', () => {
    expect(EMBER_STYLE_CONTEXT).toContain('Fonts:');
  });

  it('includes corner radius constraint', () => {
    expect(EMBER_STYLE_CONTEXT).toContain('2px');
  });

  it('prohibits box shadows', () => {
    expect(EMBER_STYLE_CONTEXT).toContain('No box shadows');
  });
});

describe('EMBER_DESIGN_CONTEXT', () => {
  it('describes Ember identity', () => {
    expect(EMBER_DESIGN_CONTEXT).toContain('Ember');
    expect(EMBER_DESIGN_CONTEXT).toContain('aristocratic tutoring');
  });

  it('includes design tokens', () => {
    expect(EMBER_DESIGN_CONTEXT).toContain('Paper:');
    expect(EMBER_DESIGN_CONTEXT).toContain('Ink:');
  });
});
