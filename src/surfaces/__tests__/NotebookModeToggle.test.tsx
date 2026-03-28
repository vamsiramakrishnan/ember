import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../Notebook.module.css', () => ({ default: {} }));

import { NotebookModeToggle } from '../NotebookModeToggle';

describe('NotebookModeToggle', () => {
  test('renders three mode buttons', () => {
    render(<NotebookModeToggle mode="linear" setMode={() => {}} />);
    expect(screen.getByText('Linear')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
    expect(screen.getByText('Graph')).toBeInTheDocument();
  });

  test('marks the active mode with aria-current', () => {
    render(<NotebookModeToggle mode="canvas" setMode={() => {}} />);
    expect(screen.getByText('Canvas')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Linear')).not.toHaveAttribute('aria-current');
  });

  test('calls setMode when a button is clicked', () => {
    const setMode = vi.fn();
    render(<NotebookModeToggle mode="linear" setMode={setMode} />);
    fireEvent.click(screen.getByText('Canvas'));
    expect(setMode).toHaveBeenCalledWith('canvas');
  });

  test('calls setMode with graph', () => {
    const setMode = vi.fn();
    render(<NotebookModeToggle mode="linear" setMode={setMode} />);
    fireEvent.click(screen.getByText('Graph'));
    expect(setMode).toHaveBeenCalledWith('graph');
  });
});
