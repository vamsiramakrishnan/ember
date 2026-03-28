import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));
vi.mock('@/hooks/useSemanticBuffer', () => ({
  useSemanticBuffer: (text: string) => ({ visible: text, pending: null }),
  pendingLabel: () => null,
}));

import { StreamingText } from '../StreamingText';

describe('StreamingText', () => {
  test('shows thinking state when empty and not done', () => {
    render(<StreamingText done={false}>{''}</StreamingText>);
    expect(screen.getByLabelText('Tutor is thinking')).toBeInTheDocument();
  });

  test('renders text when streaming', () => {
    render(<StreamingText done={false}>Partial text here</StreamingText>);
    expect(screen.getByText('Partial text here')).toBeInTheDocument();
  });

  test('renders text when done', () => {
    render(<StreamingText done={true}>Final text</StreamingText>);
    expect(screen.getByText('Final text')).toBeInTheDocument();
  });

  test('shows cursor when not done and has content', () => {
    const { container } = render(
      <StreamingText done={false}>Some text</StreamingText>,
    );
    const cursors = container.querySelectorAll('[aria-hidden="true"]');
    expect(cursors.length).toBeGreaterThan(0);
  });

  test('has aria-busy when streaming', () => {
    const { container } = render(
      <StreamingText done={false}>Text</StreamingText>,
    );
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toBeTruthy();
  });

  test('shows composing state for JSON payloads', () => {
    const json = '{"type": "visualization", "content": ""}';
    render(<StreamingText done={false}>{json}</StreamingText>);
    expect(screen.getByLabelText('Tutor is composing')).toBeInTheDocument();
  });
});
