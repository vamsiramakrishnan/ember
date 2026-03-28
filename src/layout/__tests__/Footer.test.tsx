import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Footer.module.css', () => ({ default: {} }));
vi.mock('@/primitives/Column', () => ({
  Column: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/persistence/sync/useSyncStatus', () => ({
  useSyncStatus: () => ({ state: 'idle' as const }),
}));

import { Footer } from '../Footer';

describe('Footer', () => {
  test('renders footer element', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('renders tagline text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/aristocratic tutoring for every child/),
    ).toBeInTheDocument();
  });

  test('renders sync status dot', () => {
    render(<Footer />);
    expect(screen.getByTitle('Notebook saved locally')).toBeInTheDocument();
  });
});
