import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../MarginZone.module.css', () => ({ default: { zone: 'zone' } }));

import { MarginZone } from '../MarginZone';

describe('MarginZone', () => {
  test('renders children', () => {
    render(<MarginZone>Marginal content</MarginZone>);
    expect(screen.getByText('Marginal content')).toBeInTheDocument();
  });

  test('renders as aside element', () => {
    render(<MarginZone>Content</MarginZone>);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});
