import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks/useEntityPortrait', () => ({
  useEntityPortrait: (_name: string, _dates: string, url?: string) => ({
    portraitUrl: url ?? null,
    loading: false,
  }),
}));

import { ThinkerCard } from '../ThinkerCard';
import type { Thinker } from '@/types/entries';

const thinker: Thinker = {
  name: 'Johannes Kepler',
  dates: '1571–1630',
  gift: 'The harmony of the spheres',
  bridge: 'From music to mathematics',
};

describe('ThinkerCard', () => {
  test('renders thinker name', () => {
    render(<ThinkerCard thinker={thinker} />);
    expect(screen.getByText('Johannes Kepler')).toBeInTheDocument();
  });

  test('renders thinker dates', () => {
    render(<ThinkerCard thinker={thinker} />);
    expect(screen.getByText('1571–1630')).toBeInTheDocument();
  });

  test('shows monogram when no portrait', () => {
    render(<ThinkerCard thinker={thinker} />);
    expect(screen.getByText('JK')).toBeInTheDocument();
  });

  test('shows portrait when URL provided', () => {
    const withPortrait = { ...thinker, portraitUrl: 'data:image/png;base64,abc' };
    render(<ThinkerCard thinker={withPortrait} />);
    expect(screen.getByAltText('Portrait of Johannes Kepler')).toBeInTheDocument();
  });

  test('does not show gift/bridge initially', () => {
    render(<ThinkerCard thinker={thinker} />);
    expect(screen.queryByText('The harmony of the spheres')).not.toBeInTheDocument();
  });

  test('shows gift and bridge when expanded', () => {
    render(<ThinkerCard thinker={thinker} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('The harmony of the spheres')).toBeInTheDocument();
    expect(screen.getByText('From music to mathematics')).toBeInTheDocument();
  });

  test('shows section labels when expanded', () => {
    render(<ThinkerCard thinker={thinker} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('The Gift')).toBeInTheDocument();
    expect(screen.getByText('The Bridge')).toBeInTheDocument();
  });

  test('has aria-expanded attribute', () => {
    render(<ThinkerCard thinker={thinker} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  test('supports keyboard activation', () => {
    render(<ThinkerCard thinker={thinker} />);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(screen.getByText('The harmony of the spheres')).toBeInTheDocument();
  });
});
