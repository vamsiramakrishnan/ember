import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { Connection } from '../Connection';

describe('Connection', () => {
  test('renders emphasized and rest text', () => {
    const text = 'Kepler and Pythagoras both sought harmony in the cosmos.';
    render(<Connection emphasisEnd={26}>{text}</Connection>);
    expect(screen.getByText('Kepler and Pythagoras both')).toBeInTheDocument();
    // MarkdownContent mock renders rest as <span> — text is trimmed by getByText
    expect(screen.getByText(/sought harmony in the cosmos/)).toBeInTheDocument();
  });

  test('has a margin rule element', () => {
    const { container } = render(<Connection emphasisEnd={5}>Hello world</Connection>);
    // Should have at least 2 children: rule + text
    const outer = container.firstElementChild;
    expect(outer?.children.length).toBeGreaterThanOrEqual(2);
  });

  test('renders full text as emphasized when emphasisEnd covers all', () => {
    const text = 'All emphasized';
    render(<Connection emphasisEnd={text.length}>{text}</Connection>);
    expect(screen.getByText('All emphasized')).toBeInTheDocument();
  });

  test('renders nothing emphasized when emphasisEnd is 0', () => {
    render(<Connection emphasisEnd={0}>Some text</Connection>);
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });
});
