import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { SocraticQuestion } from '../SocraticQuestion';

describe('SocraticQuestion', () => {
  test('renders content text', () => {
    render(<SocraticQuestion>What if gravity were a force of harmony?</SocraticQuestion>);
    expect(screen.getByText('What if gravity were a force of harmony?')).toBeInTheDocument();
  });

  test('renders as a blockquote', () => {
    const { container } = render(<SocraticQuestion>Question</SocraticQuestion>);
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  test('has role note', () => {
    render(<SocraticQuestion>Question</SocraticQuestion>);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<SocraticQuestion>Question</SocraticQuestion>);
    expect(screen.getByLabelText("Tutor's question")).toBeInTheDocument();
  });
});
