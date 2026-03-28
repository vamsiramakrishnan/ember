import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { BlockMenu } from '../BlockMenu';

describe('BlockMenu', () => {
  const defaultProps = {
    onTextSelect: vi.fn(),
    onContentSelect: vi.fn(),
  };

  test('renders text block options', () => {
    render(<BlockMenu {...defaultProps} />);
    expect(screen.getByText('prose')).toBeInTheDocument();
    expect(screen.getByText('question')).toBeInTheDocument();
    expect(screen.getByText('hypothesis')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
  });

  test('renders content block options', () => {
    render(<BlockMenu {...defaultProps} />);
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('file')).toBeInTheDocument();
    expect(screen.getByText('link')).toBeInTheDocument();
  });

  test('calls onTextSelect when text block clicked', () => {
    const onTextSelect = vi.fn();
    render(<BlockMenu {...defaultProps} onTextSelect={onTextSelect} />);
    fireEvent.click(screen.getByText('prose'));
    expect(onTextSelect).toHaveBeenCalledWith('prose');
  });

  test('calls onContentSelect when content block clicked', () => {
    const onContentSelect = vi.fn();
    render(<BlockMenu {...defaultProps} onContentSelect={onContentSelect} />);
    fireEvent.click(screen.getByText('code'));
    expect(onContentSelect).toHaveBeenCalledWith('code-cell');
  });

  test('shows paste buttons when onPaste provided', () => {
    const onPaste = vi.fn();
    render(<BlockMenu {...defaultProps} onPaste={onPaste} />);
    const pasteButtons = screen.getAllByText('paste');
    expect(pasteButtons.length).toBeGreaterThan(0);
  });

  test('does not show paste buttons when onPaste not provided', () => {
    render(<BlockMenu {...defaultProps} />);
    expect(screen.queryByText('paste')).not.toBeInTheDocument();
  });

  test('renders section labels', () => {
    render(<BlockMenu {...defaultProps} />);
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  test('all text block buttons have menuitem role', () => {
    render(<BlockMenu {...defaultProps} />);
    const menuitems = screen.getAllByRole('menuitem');
    expect(menuitems.length).toBe(8); // 4 text + 4 content
  });
});
