import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Group } from '../Group';

describe('Group', () => {
  test('renders children when not collapsed', () => {
    render(
      <Group>
        <div>Item 1</div>
        <div>Item 2</div>
      </Group>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  test('shows collapse button when more than 1 child', () => {
    render(
      <Group>
        <div>A</div>
        <div>B</div>
      </Group>,
    );
    expect(screen.getByText('collapse')).toBeInTheDocument();
  });

  test('does not show collapse button for single child', () => {
    render(
      <Group>
        <div>Only one</div>
      </Group>,
    );
    expect(screen.queryByText('collapse')).not.toBeInTheDocument();
  });

  test('collapses and shows preview text and count', () => {
    render(
      <Group previewText="First item">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Group>,
    );
    fireEvent.click(screen.getByText('collapse'));
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('+ 2 more')).toBeInTheDocument();
  });

  test('expands when collapsed label is clicked', () => {
    render(
      <Group previewText="Preview">
        <div>Item 1</div>
        <div>Item 2</div>
      </Group>,
    );
    fireEvent.click(screen.getByText('collapse'));
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  test('uses default preview text when none provided', () => {
    render(
      <Group>
        <div>A</div>
        <div>B</div>
      </Group>,
    );
    fireEvent.click(screen.getByText('collapse'));
    expect(screen.getByText('Grouped items')).toBeInTheDocument();
  });
});
