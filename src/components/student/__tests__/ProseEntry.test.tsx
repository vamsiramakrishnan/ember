import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { ProseEntry } from '../ProseEntry';

describe('ProseEntry', () => {
  test('renders content text', () => {
    render(<ProseEntry>Hello world</ProseEntry>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('renders as a paragraph element', () => {
    const { container } = render(<ProseEntry>Some text</ProseEntry>);
    expect(container.querySelector('p')).toBeInTheDocument();
  });

  test('passes inline mode to MarkdownContent', () => {
    const { container } = render(<ProseEntry>Test</ProseEntry>);
    expect(container.querySelector('p')).toBeTruthy();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
