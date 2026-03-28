import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/services/visual-generation', () => ({
  generateInlineSketch: () => Promise.resolve('data:image/png;base64,abc'),
}));

import { InlineSketch, parseSketchMarkers } from '../InlineSketch';

describe('InlineSketch', () => {
  test('shows loading placeholder initially', () => {
    render(<InlineSketch description="A wave function" />);
    expect(screen.getByLabelText('Generating sketch...')).toBeInTheDocument();
  });
});

describe('parseSketchMarkers', () => {
  test('returns text-only segment for text without markers', () => {
    const result = parseSketchMarkers('No sketches here');
    expect(result).toEqual([{ type: 'text', content: 'No sketches here' }]);
  });

  test('extracts sketch marker', () => {
    const result = parseSketchMarkers('Before [sketch: wave] after');
    expect(result).toEqual([
      { type: 'text', content: 'Before ' },
      { type: 'sketch', description: 'wave' },
      { type: 'text', content: ' after' },
    ]);
  });

  test('handles multiple sketch markers', () => {
    const result = parseSketchMarkers('[sketch: A] and [sketch: B]');
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ type: 'sketch', description: 'A' });
    expect(result[1]).toEqual({ type: 'text', content: ' and ' });
    expect(result[2]).toEqual({ type: 'sketch', description: 'B' });
  });

  test('handles empty text', () => {
    const result = parseSketchMarkers('');
    expect(result).toEqual([{ type: 'text', content: '' }]);
  });

  test('trims description whitespace', () => {
    const result = parseSketchMarkers('[sketch:   spaced   ]');
    expect(result[0]).toEqual({ type: 'sketch', description: 'spaced' });
  });
});
