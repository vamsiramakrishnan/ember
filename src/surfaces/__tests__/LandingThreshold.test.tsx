import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../LandingThreshold.module.css', () => ({ default: {} }));
vi.mock('../Landing.module.css', () => ({ default: {} }));
vi.mock('@/hooks/useScrollReveal', () => ({
  useScrollReveal: () => [vi.fn(), true],
}));
vi.mock('@/persistence', () => ({
  Store: { Students: 'students' },
  notify: vi.fn(),
}));
vi.mock('@/persistence/repositories/students', () => ({
  createStudent: vi.fn().mockResolvedValue({ id: 's1', name: 'Test', displayName: 'Test' }),
}));

import { LandingThreshold } from '../LandingThreshold';
import type { StudentRecord } from '@/persistence/records';

const mockStudents: StudentRecord[] = [
  {
    id: 's1', name: 'Ada', displayName: 'Ada',
    avatarSeed: 'ada', totalMinutes: 120,
    createdAt: Date.now(), updatedAt: Date.now(),
  } as StudentRecord,
];

describe('LandingThreshold', () => {
  test('renders student list', () => {
    render(
      <LandingThreshold
        students={mockStudents}
        onSelect={vi.fn()}
        isConfigured={false}
        isAuthenticated={false}
        signInWithOAuth={vi.fn()}
      />,
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  test('shows OAuth buttons when configured and not authenticated', () => {
    render(
      <LandingThreshold
        students={[]}
        onSelect={vi.fn()}
        isConfigured={true}
        isAuthenticated={false}
        signInWithOAuth={vi.fn()}
      />,
    );
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  test('hides OAuth buttons when already authenticated', () => {
    render(
      <LandingThreshold
        students={[]}
        onSelect={vi.fn()}
        isConfigured={true}
        isAuthenticated={true}
        signInWithOAuth={vi.fn()}
      />,
    );
    expect(screen.queryByText('sign in')).not.toBeInTheDocument();
  });

  test('calls signInWithOAuth when provider clicked', () => {
    const signIn = vi.fn();
    render(
      <LandingThreshold
        students={[]}
        onSelect={vi.fn()}
        isConfigured={true}
        isAuthenticated={false}
        signInWithOAuth={signIn}
      />,
    );
    fireEvent.click(screen.getByText('Google'));
    expect(signIn).toHaveBeenCalledWith('google');
  });
});
