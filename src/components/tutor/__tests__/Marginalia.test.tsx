import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock MarkdownContent to render plain text without pulling in remark/rehype
vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));
vi.mock('../InlineSketch', () => ({
  InlineSketch: () => <div data-testid="inline-sketch" />,
  parseSketchMarkers: (text: string) => [{ type: 'text' as const, content: text }],
}));

import { Marginalia } from '../Marginalia';

describe('Marginalia', () => {
  test('renders content text', () => {
    render(<Marginalia>Consider the harmonics of planetary motion.</Marginalia>);
    expect(
      screen.getByText('Consider the harmonics of planetary motion.'),
    ).toBeInTheDocument();
  });

  test('has a container with rule and text elements', () => {
    const { container } = render(
      <Marginalia>Some tutor note.</Marginalia>,
    );
    // The component renders a div > div.rule + div.text structure
    const outerDiv = container.firstElementChild;
    expect(outerDiv).toBeTruthy();
    expect(outerDiv?.children.length).toBeGreaterThanOrEqual(2);
  });

  test('renders plain text without sketch markers', () => {
    render(<Marginalia>No sketches here.</Marginalia>);
    expect(screen.getByText('No sketches here.')).toBeInTheDocument();
    expect(screen.queryByTestId('inline-sketch')).not.toBeInTheDocument();
  });
});
