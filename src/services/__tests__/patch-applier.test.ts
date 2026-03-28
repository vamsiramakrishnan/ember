/**
 * Tests for patch-applier — layered HTML patching strategies.
 */
import { describe, test, expect } from 'vitest';
import { applyPatches } from '../patch-applier';
import type { Patch } from '../patch-applier';

describe('applyPatches', () => {
  test('applies exact string match', () => {
    const html = '<p>Hello World</p>';
    const patches: Patch[] = [{ search: 'Hello World', replace: 'Hi Earth' }];
    expect(applyPatches(html, patches)).toBe('<p>Hi Earth</p>');
  });

  test('applies multiple patches in sequence', () => {
    const html = '<p>AAA BBB</p>';
    const patches: Patch[] = [
      { search: 'AAA', replace: 'CCC' },
      { search: 'BBB', replace: 'DDD' },
    ];
    expect(applyPatches(html, patches)).toBe('<p>CCC DDD</p>');
  });

  test('returns unchanged HTML when no match found', () => {
    const html = '<div>content</div>';
    const patches: Patch[] = [{ search: 'nonexistent', replace: 'new' }];
    expect(applyPatches(html, patches)).toBe(html);
  });

  test('handles whitespace-normalized matching', () => {
    const html = '<p>Hello    World</p>';
    const patches: Patch[] = [{ search: 'Hello World', replace: 'Hi' }];
    const result = applyPatches(html, patches);
    expect(result).toContain('Hi');
    expect(result).not.toContain('Hello');
  });

  test('handles selector-based matching with class selector', () => {
    const html = '<div class="target">old content</div>';
    const patches: Patch[] = [
      { search: '', replace: 'new content', selector: '.target' },
    ];
    const result = applyPatches(html, patches);
    expect(result).toContain('new content');
  });

  test('handles selector-based matching with id selector', () => {
    const html = '<div id="myid">old content</div>';
    const patches: Patch[] = [
      { search: '', replace: 'replaced', selector: '#myid' },
    ];
    const result = applyPatches(html, patches);
    expect(result).toContain('replaced');
  });

  test('returns unchanged when selector does not match', () => {
    const html = '<div class="other">content</div>';
    const patches: Patch[] = [
      { search: '', replace: 'new', selector: '.nonexistent' },
    ];
    expect(applyPatches(html, patches)).toBe(html);
  });

  test('handles empty patches array', () => {
    const html = '<p>unchanged</p>';
    expect(applyPatches(html, [])).toBe(html);
  });

  test('prefers exact match over whitespace-normalized', () => {
    const html = '<p>exact match here</p>';
    const patches: Patch[] = [{ search: 'exact match here', replace: 'done' }];
    expect(applyPatches(html, patches)).toBe('<p>done</p>');
  });

  test('whitespace match handles newlines', () => {
    const html = '<p>Hello\n  World</p>';
    const patches: Patch[] = [{ search: 'Hello World', replace: 'Hi' }];
    const result = applyPatches(html, patches);
    expect(result).toContain('Hi');
  });
});

describe('RefinementStep interface', () => {
  test('conforms to expected shape', () => {
    const step: import('../patch-applier').RefinementStep = {
      iteration: 1,
      patchCount: 3,
      issues: ['fix typo', 'update date'],
      score: 6,
    };
    expect(step.iteration).toBe(1);
    expect(step.issues).toHaveLength(2);
  });
});
