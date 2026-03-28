import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../NotebookSelect.module.css', () => ({ default: {} }));

import { NotebookList } from '../NotebookList';
import type { NotebookRecord } from '@/persistence/records';

const mockNotebooks: NotebookRecord[] = [
  {
    id: 'nb1', title: 'Kepler Study', description: 'Orbital mechanics',
    studentId: 's1', sessionCount: 3, discipline: 'Astronomy',
    createdAt: Date.now(), updatedAt: Date.now(),
  } as NotebookRecord,
];

const baseProps = {
  notebooks: mockNotebooks,
  showForm: false,
  title: '',
  question: '',
  onSelect: vi.fn(),
  onShowForm: vi.fn(),
  onHideForm: vi.fn(),
  onTitleChange: vi.fn(),
  onQuestionChange: vi.fn(),
  onKeyDown: vi.fn(),
  onCreate: vi.fn(),
};

describe('NotebookList', () => {
  test('renders notebook cards', () => {
    render(<NotebookList {...baseProps} />);
    expect(screen.getByText('Kepler Study')).toBeInTheDocument();
  });

  test('shows session count', () => {
    render(<NotebookList {...baseProps} />);
    expect(screen.getByText('3 sessions')).toBeInTheDocument();
  });

  test('renders "begin a new exploration" button when form hidden', () => {
    render(<NotebookList {...baseProps} />);
    expect(screen.getByText('begin a new exploration')).toBeInTheDocument();
  });

  test('calls onShowForm when new exploration button clicked', () => {
    const onShowForm = vi.fn();
    render(<NotebookList {...baseProps} onShowForm={onShowForm} />);
    fireEvent.click(screen.getByText('begin a new exploration'));
    expect(onShowForm).toHaveBeenCalledTimes(1);
  });

  test('shows form when showForm is true', () => {
    render(<NotebookList {...baseProps} showForm={true} />);
    expect(screen.getByPlaceholderText('What do you want to explore?')).toBeInTheDocument();
  });

  test('disables begin button when title is empty', () => {
    render(<NotebookList {...baseProps} showForm={true} title="" />);
    expect(screen.getByText('begin')).toBeDisabled();
  });

  test('enables begin button when title provided', () => {
    render(<NotebookList {...baseProps} showForm={true} title="My topic" />);
    expect(screen.getByText('begin')).not.toBeDisabled();
  });

  test('shows "Start exploring" when no notebooks', () => {
    render(<NotebookList {...baseProps} notebooks={[]} />);
    expect(screen.getByText('Start exploring')).toBeInTheDocument();
  });

  test('calls onSelect when notebook card clicked', () => {
    const onSelect = vi.fn();
    render(<NotebookList {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Kepler Study'));
    expect(onSelect).toHaveBeenCalledWith(mockNotebooks[0]);
  });
});
