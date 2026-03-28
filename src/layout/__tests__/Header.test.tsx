import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Header.module.css', () => ({ default: {} }));
vi.mock('../Navigation.module.css', () => ({ default: {} }));
vi.mock('@/primitives/Column', () => ({
  Column: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/peripheral/StudentIdentity', () => ({
  StudentIdentity: ({ name }: { name: string }) => <span data-testid="identity">{name}</span>,
}));
vi.mock('@/contexts/StudentContext', () => ({
  useStudent: () => ({
    student: { id: 's1', displayName: 'Ada', totalMinutes: 60 },
    notebook: { id: 'nb1', title: 'Kepler Study' },
    setNotebook: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { Header } from '../Header';

describe('Header', () => {
  test('renders logo', () => {
    render(<Header activeSurface="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByText('Ember')).toBeInTheDocument();
  });

  test('renders notebook breadcrumb', () => {
    render(<Header activeSurface="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByText('Kepler Study')).toBeInTheDocument();
  });

  test('renders student identity', () => {
    render(<Header activeSurface="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByTestId('identity')).toHaveTextContent('Ada');
  });

  test('renders navigation', () => {
    render(<Header activeSurface="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByText('Notebook')).toBeInTheDocument();
    expect(screen.getByText('Constellation')).toBeInTheDocument();
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  test('renders header element', () => {
    render(<Header activeSurface="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
