import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ExerciseSet } from '../ExerciseSet';
import type { Exercise } from '@/types/entries';

const exercises: Exercise[] = [
  {
    prompt: 'Explain Newton\'s first law',
    format: 'open-response',
    approach: 'Describe how objects remain at rest or in uniform motion unless acted upon by a net force',
    hints: ['Think about inertia', 'Consider the absence of forces'],
    concept: 'mechanics',
  },
  {
    prompt: 'Derive E=mc²',
    format: 'explain',
    approach: 'Start from Lorentz transformation and show mass-energy equivalence',
    hints: ['Start with Lorentz transformation'],
    concept: 'relativity',
  },
];

describe('ExerciseSet', () => {
  test('renders collapsed header with title', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    expect(screen.getByText('Physics')).toBeInTheDocument();
  });

  test('shows exercise count', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    expect(screen.getByText('2 exercises')).toBeInTheDocument();
  });

  test('shows difficulty badge', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="advanced" />);
    expect(screen.getByText('advanced')).toBeInTheDocument();
  });

  test('expands when header clicked', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    fireEvent.click(screen.getByLabelText(/Expand exercises/));
    expect(screen.getByText("Explain Newton's first law")).toBeInTheDocument();
  });

  test('shows hint button when hints available', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    fireEvent.click(screen.getByLabelText(/Expand exercises/));
    expect(screen.getByText('show hint (1/2)')).toBeInTheDocument();
  });

  test('reveals hints progressively', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    fireEvent.click(screen.getByLabelText(/Expand exercises/));
    fireEvent.click(screen.getByText('show hint (1/2)'));
    expect(screen.getByText(/Think about inertia/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('show hint (2/2)'));
    expect(screen.getByText(/Consider the absence of forces/)).toBeInTheDocument();
  });

  test('navigates between exercises', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    fireEvent.click(screen.getByLabelText(/Expand exercises/));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('→'));
    expect(screen.getByText('Derive E=mc²')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  test('shows concept tag', () => {
    render(<ExerciseSet title="Physics" exercises={exercises} difficulty="intermediate" />);
    fireEvent.click(screen.getByLabelText(/Expand exercises/));
    expect(screen.getByText('mechanics')).toBeInTheDocument();
  });
});
