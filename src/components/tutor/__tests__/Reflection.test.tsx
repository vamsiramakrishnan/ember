import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { Reflection } from '../Reflection';

describe('Reflection', () => {
  test('renders content text', () => {
    render(<Reflection>You've made significant progress.</Reflection>);
    expect(screen.getByText("You've made significant progress.")).toBeInTheDocument();
  });

  test('returns null for empty content', () => {
    const { container } = render(<Reflection>{''}</Reflection>);
    expect(container.firstChild).toBeNull();
  });

  test('returns null for whitespace-only content', () => {
    const { container } = render(<Reflection>{'   '}</Reflection>);
    expect(container.firstChild).toBeNull();
  });

  test('has two rule elements', () => {
    const { container } = render(<Reflection>Reflection text</Reflection>);
    const children = container.firstElementChild?.children;
    // rule + text + rule = 3 children
    expect(children?.length).toBe(3);
  });
});
