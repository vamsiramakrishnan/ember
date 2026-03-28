import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/tokens/colors', () => ({
  colors: { inkSoft: '#5A534D' },
}));

import { SketchInput } from '../SketchInput';

describe('SketchInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  test('renders a canvas element', () => {
    render(<SketchInput {...defaultProps} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<SketchInput {...defaultProps} />);
    expect(screen.getByLabelText(/Drawing canvas/)).toBeInTheDocument();
  });

  test('renders clear, cancel, and done buttons', () => {
    render(<SketchInput {...defaultProps} />);
    expect(screen.getByText('clear')).toBeInTheDocument();
    expect(screen.getByText('cancel')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  test('done button is disabled when no strokes', () => {
    render(<SketchInput {...defaultProps} />);
    const doneBtn = screen.getByText('done');
    expect(doneBtn).toBeDisabled();
  });

  test('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<SketchInput {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('canvas has correct dimensions', () => {
    const { container } = render(<SketchInput {...defaultProps} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(560);
    expect(canvas.height).toBe(200);
  });
});
