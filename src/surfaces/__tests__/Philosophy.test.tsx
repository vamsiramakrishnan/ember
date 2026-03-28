import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Philosophy.module.css', () => ({ default: {} }));
vi.mock('@/primitives/Column', () => ({
  Column: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/primitives/Text', () => ({
  Text: ({ children, ...rest }: Record<string, unknown>) => (
    <span data-variant={rest.variant}>{children as React.ReactNode}</span>
  ),
}));
vi.mock('@/primitives/Rule', () => ({
  Rule: () => <hr />,
}));
vi.mock('@/tokens/spacing', () => ({
  spacing: { headerToContent: 24, sectionGap: 32 },
}));

import { Philosophy } from '../Philosophy';

describe('Philosophy', () => {
  test('renders the page title', () => {
    render(<Philosophy />);
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  test('renders six principles', () => {
    render(<Philosophy />);
    expect(screen.getByText('The tutor never answers first')).toBeInTheDocument();
    expect(screen.getByText('Curiosity is the curriculum')).toBeInTheDocument();
    expect(screen.getByText('Mastery is invisible')).toBeInTheDocument();
    expect(screen.getByText('Every idea has a person')).toBeInTheDocument();
    expect(screen.getByText(/The interface is a notebook/)).toBeInTheDocument();
    expect(screen.getByText('Silence is a feature')).toBeInTheDocument();
  });

  test('renders roman numerals', () => {
    render(<Philosophy />);
    expect(screen.getByText('I.')).toBeInTheDocument();
    expect(screen.getByText('VI.')).toBeInTheDocument();
  });

  test('renders the central question', () => {
    render(<Philosophy />);
    expect(
      screen.getByText(/What if every child had a tutor/),
    ).toBeInTheDocument();
  });
});
