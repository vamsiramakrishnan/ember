import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../Landing.module.css', () => ({ default: {} }));
vi.mock('@/persistence', () => ({
  Store: { Students: 'students' },
  notify: vi.fn(),
}));
vi.mock('@/persistence/repositories/students', () => ({
  createStudent: vi.fn().mockResolvedValue({
    id: 's2', name: 'Bob', displayName: 'Bob',
    avatarSeed: 'bob', totalMinutes: 0,
  }),
}));

import { LandingStudentList } from '../LandingStudentList';
import type { StudentRecord } from '@/persistence/records';

const students: StudentRecord[] = [
  {
    id: 's1', name: 'Ada', displayName: 'Ada',
    avatarSeed: 'ada', totalMinutes: 120,
    createdAt: Date.now(), updatedAt: Date.now(),
  } as StudentRecord,
];

describe('LandingStudentList', () => {
  test('renders student names', () => {
    render(<LandingStudentList students={students} onSelect={vi.fn()} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  test('shows "Continue" when students exist', () => {
    render(<LandingStudentList students={students} onSelect={vi.fn()} />);
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  test('shows "Begin" when no students', () => {
    render(<LandingStudentList students={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('Begin')).toBeInTheDocument();
  });

  test('calls onSelect when student clicked', () => {
    const onSelect = vi.fn();
    render(<LandingStudentList students={students} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Ada'));
    expect(onSelect).toHaveBeenCalledWith(students[0]);
  });

  test('shows form when "open a new notebook" clicked', () => {
    render(<LandingStudentList students={[]} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByText('open a new notebook'));
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
  });

  test('shows hours for students with time', () => {
    render(<LandingStudentList students={students} onSelect={vi.fn()} />);
    expect(screen.getByText('2 hours')).toBeInTheDocument();
  });
});
