import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  test('renders three tab buttons', () => {
    render(<Navigation active="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByText('Notebook')).toBeInTheDocument();
    expect(screen.getByText('Constellation')).toBeInTheDocument();
    expect(screen.getByText('Philosophy')).toBeInTheDocument();
  });

  test('highlights the active tab with aria-current', () => {
    render(<Navigation active="constellation" onNavigate={vi.fn()} />);
    expect(screen.getByText('Constellation')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Notebook')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Philosophy')).not.toHaveAttribute('aria-current');
  });

  test('calls onNavigate with the correct surface when a tab is clicked', () => {
    const onNavigate = vi.fn();
    render(<Navigation active="notebook" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Philosophy'));
    expect(onNavigate).toHaveBeenCalledWith('philosophy');
  });

  test('calls onNavigate for each tab', () => {
    const onNavigate = vi.fn();
    render(<Navigation active="notebook" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Constellation'));
    expect(onNavigate).toHaveBeenCalledWith('constellation');
    fireEvent.click(screen.getByText('Notebook'));
    expect(onNavigate).toHaveBeenCalledWith('notebook');
  });

  test('renders inside a nav element with accessible label', () => {
    render(<Navigation active="notebook" onNavigate={vi.fn()} />);
    expect(screen.getByRole('navigation')).toHaveAttribute(
      'aria-label',
      'Ember surfaces',
    );
  });
});
