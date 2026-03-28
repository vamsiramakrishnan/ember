import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Shell.module.css', () => ({ default: {} }));
vi.mock('@/tokens/custom-properties', () => ({
  getTokenCSS: () => ':root{}',
}));
vi.mock('@/hooks/useAmbientTexture', () => ({
  useAmbientTexture: () => null,
}));
vi.mock('@/tokens/global.css', () => ({}));

import { Shell } from '../Shell';

describe('Shell', () => {
  test('renders children', () => {
    render(<Shell>Hello Ember</Shell>);
    expect(screen.getByText('Hello Ember')).toBeInTheDocument();
  });

  test('injects token CSS', () => {
    const { container } = render(<Shell>Content</Shell>);
    const style = container.querySelector('style');
    expect(style).toBeInTheDocument();
    expect(style?.textContent).toContain(':root');
  });

  test('does not render ambient layer when no texture', () => {
    const { container } = render(<Shell>Content</Shell>);
    const ambient = container.querySelector('[aria-hidden="true"]');
    expect(ambient).toBeNull();
  });
});
