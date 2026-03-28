/**
 * Tests for useSemanticBuffer — masks incomplete streaming blocks.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSemanticBuffer, pendingLabel } from '../useSemanticBuffer';

describe('useSemanticBuffer', () => {
  it('passes through text when done', () => {
    const { result } = renderHook(() => useSemanticBuffer('hello world', true));
    expect(result.current.visible).toBe('hello world');
    expect(result.current.pending).toBeNull();
  });

  it('passes through empty string', () => {
    const { result } = renderHook(() => useSemanticBuffer('', false));
    expect(result.current.visible).toBe('');
    expect(result.current.pending).toBeNull();
  });

  it('detects unclosed code fence', () => {
    const text = 'Some text\n```python\nprint("hello")';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBe('code');
    expect(result.current.visible).not.toContain('```python');
  });

  it('passes through closed code fence', () => {
    const text = 'Some text\n```python\nprint("hello")\n```\nMore text';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBeNull();
    expect(result.current.visible).toBe(text);
  });

  it('detects unclosed display math', () => {
    const text = 'Consider\n$$\nE = mc^2';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBe('math');
  });

  it('passes through closed display math', () => {
    const text = 'Consider\n$$\nE = mc^2\n$$\nThis is important';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBeNull();
  });

  it('detects incomplete table row', () => {
    const text = 'Header\n| Column 1 | Column 2 |\n| --- | --- |\n| data1';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBe('table');
  });

  it('passes through complete table', () => {
    const text = '| Col1 | Col2 |\n| --- | --- |\n| d1 | d2 |';
    const { result } = renderHook(() => useSemanticBuffer(text, false));
    expect(result.current.pending).toBeNull();
  });

  it('always passes through when done regardless of content', () => {
    const text = 'Some text\n```python\nprint("hello")';
    const { result } = renderHook(() => useSemanticBuffer(text, true));
    expect(result.current.visible).toBe(text);
    expect(result.current.pending).toBeNull();
  });
});

describe('pendingLabel', () => {
  it('returns label for code', () => {
    expect(pendingLabel('code')).toBe('composing code…');
  });

  it('returns label for math', () => {
    expect(pendingLabel('math')).toBe('composing equation…');
  });

  it('returns label for table', () => {
    expect(pendingLabel('table')).toBe('composing table…');
  });

  it('returns null for null', () => {
    expect(pendingLabel(null)).toBeNull();
  });
});
