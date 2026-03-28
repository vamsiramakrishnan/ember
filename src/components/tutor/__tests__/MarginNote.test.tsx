import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { MarginNote } from '../MarginNote';

describe('MarginNote', () => {
  test('renders content text', () => {
    render(<MarginNote>A brief margin note.</MarginNote>);
    expect(screen.getByText('A brief margin note.')).toBeInTheDocument();
  });

  test('has role note', () => {
    render(<MarginNote>Note</MarginNote>);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<MarginNote>Note</MarginNote>);
    expect(screen.getByLabelText('Tutor annotation')).toBeInTheDocument();
  });

  test('renders as aside element', () => {
    const { container } = render(<MarginNote>Note</MarginNote>);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  test('renders without crashing when isConnection is true', () => {
    render(<MarginNote isConnection>Connection note</MarginNote>);
    expect(screen.getByText('Connection note')).toBeInTheDocument();
  });
});
