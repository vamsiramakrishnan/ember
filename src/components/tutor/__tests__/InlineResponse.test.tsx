import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { InlineResponse } from '../InlineResponse';

describe('InlineResponse', () => {
  test('renders quoted text', () => {
    render(
      <InlineResponse quotedText="harmonic series" intent="explain">
        The harmonic series is...
      </InlineResponse>,
    );
    expect(screen.getByText('harmonic series')).toBeInTheDocument();
  });

  test('renders tutor response', () => {
    render(
      <InlineResponse quotedText="text" intent="explain">
        Response content
      </InlineResponse>,
    );
    expect(screen.getByText('Response content')).toBeInTheDocument();
  });

  test('renders intent label for explain', () => {
    render(
      <InlineResponse quotedText="text" intent="explain">
        Response
      </InlineResponse>,
    );
    expect(screen.getByText('on')).toBeInTheDocument();
  });

  test('renders intent label for define', () => {
    render(
      <InlineResponse quotedText="text" intent="define">
        Response
      </InlineResponse>,
    );
    expect(screen.getByText('defining')).toBeInTheDocument();
  });

  test('renders intent label for connect', () => {
    render(
      <InlineResponse quotedText="text" intent="connect">
        Response
      </InlineResponse>,
    );
    expect(screen.getByText('connecting')).toBeInTheDocument();
  });

  test('renders blockquote for quoted text', () => {
    const { container } = render(
      <InlineResponse quotedText="text" intent="explain">
        Response
      </InlineResponse>,
    );
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });
});
