import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { QuestionBubble } from '../QuestionBubble';

describe('QuestionBubble', () => {
  test('renders content text', () => {
    render(<QuestionBubble>Why do planets orbit?</QuestionBubble>);
    expect(screen.getByText('Why do planets orbit?')).toBeInTheDocument();
  });

  test('renders the question glyph', () => {
    render(<QuestionBubble>Question</QuestionBubble>);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  test('renders as a paragraph element', () => {
    const { container } = render(<QuestionBubble>Test</QuestionBubble>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
