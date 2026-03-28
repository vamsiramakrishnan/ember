import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { ScratchNote } from '../ScratchNote';

describe('ScratchNote', () => {
  test('renders content text', () => {
    render(<ScratchNote>A half-formed idea</ScratchNote>);
    expect(screen.getByText('A half-formed idea')).toBeInTheDocument();
  });

  test('renders the dot glyph', () => {
    render(<ScratchNote>Note</ScratchNote>);
    expect(screen.getByText('·')).toBeInTheDocument();
  });

  test('renders as a paragraph element', () => {
    const { container } = render(<ScratchNote>Test</ScratchNote>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
