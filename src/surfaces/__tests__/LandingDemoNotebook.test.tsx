import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../LandingDemoNotebook.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useTypewriter', () => ({
  useTypewriter: (text: string) => text,
}));

import { LandingDemoNotebook } from '../LandingDemoNotebook';

describe('LandingDemoNotebook', () => {
  test('renders input hint keys', () => {
    render(<LandingDemoNotebook active={false} />);
    expect(screen.getByText('commands')).toBeInTheDocument();
    expect(screen.getByText('reference')).toBeInTheDocument();
    expect(screen.getByText('ask tutor')).toBeInTheDocument();
  });

  test('renders student text when active', () => {
    render(<LandingDemoNotebook active={true} />);
    expect(screen.getByText(/been reading about how/)).toBeInTheDocument();
  });
});
