import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Table } from '../Table';

describe('Table', () => {
  const headers = ['Planet', 'Period', 'Distance'];
  const rows = [
    ['Mercury', '88 days', '0.39 AU'],
    ['Venus', '225 days', '0.72 AU'],
  ];

  test('renders headers', () => {
    render(<Table headers={headers} rows={rows} />);
    headers.forEach((h) => {
      expect(screen.getByText(h)).toBeInTheDocument();
    });
  });

  test('renders all row cells', () => {
    render(<Table headers={headers} rows={rows} />);
    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getByText('88 days')).toBeInTheDocument();
    expect(screen.getByText('Venus')).toBeInTheDocument();
  });

  test('renders correct number of rows', () => {
    const { container } = render(<Table headers={headers} rows={rows} />);
    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBe(2);
  });

  test('renders empty table with no rows', () => {
    const { container } = render(<Table headers={headers} rows={[]} />);
    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBe(0);
  });
});
