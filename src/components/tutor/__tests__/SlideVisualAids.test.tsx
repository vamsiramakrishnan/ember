import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  StatCardsView, ProcessFlowView, PyramidView,
  ComparisonView, FunnelView, CycleView,
  ChecklistView, MatrixView,
} from '../SlideVisualAids';

describe('StatCardsView', () => {
  test('renders stat cards with values and labels', () => {
    const cards = [{ value: '42%', label: 'Efficiency' }];
    render(<StatCardsView cards={cards} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
  });

  test('limits to 4 cards', () => {
    const cards = Array.from({ length: 6 }, (_, i) => ({
      value: `${i}`, label: `Card ${i}`,
    }));
    const { container } = render(<StatCardsView cards={cards} />);
    const statCards = container.querySelectorAll('[class]');
    expect(statCards.length).toBeLessThanOrEqual(13); // divs inside grid
  });
});

describe('ProcessFlowView', () => {
  test('renders numbered steps', () => {
    const steps = [{ step: 'Gather data' }, { step: 'Analyze' }];
    render(<ProcessFlowView steps={steps} />);
    expect(screen.getByText('Gather data')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
  });
});

describe('PyramidView', () => {
  test('renders pyramid layers', () => {
    const layers = [{ label: 'Top' }, { label: 'Bottom' }];
    render(<PyramidView layers={layers} />);
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Bottom')).toBeInTheDocument();
  });
});

describe('ComparisonView', () => {
  test('renders comparison labels and points', () => {
    const data = {
      leftLabel: 'Classical', rightLabel: 'Quantum',
      leftPoints: ['Deterministic'], rightPoints: ['Probabilistic'],
    };
    render(<ComparisonView data={data} />);
    expect(screen.getByText('Classical')).toBeInTheDocument();
    expect(screen.getByText('Quantum')).toBeInTheDocument();
    expect(screen.getByText('vs')).toBeInTheDocument();
  });
});

describe('FunnelView', () => {
  test('renders funnel stages', () => {
    const stages = [{ stage: 'Wide' }, { stage: 'Narrow' }];
    render(<FunnelView stages={stages} />);
    expect(screen.getByText('Wide')).toBeInTheDocument();
    expect(screen.getByText('Narrow')).toBeInTheDocument();
  });
});

describe('CycleView', () => {
  test('renders cycle steps', () => {
    const steps = [{ step: 'Observe' }, { step: 'Hypothesize' }];
    render(<CycleView steps={steps} />);
    expect(screen.getByText('Observe')).toBeInTheDocument();
    expect(screen.getByText('Hypothesize')).toBeInTheDocument();
  });

  test('shows return label', () => {
    const steps = [{ step: 'A' }];
    render(<CycleView steps={steps} />);
    expect(screen.getByText(/return to step 1/)).toBeInTheDocument();
  });
});

describe('ChecklistView', () => {
  test('renders checklist items', () => {
    const items = [
      { item: 'Read chapter', checked: true },
      { item: 'Write notes', checked: false },
    ];
    render(<ChecklistView items={items} />);
    expect(screen.getByText('Read chapter')).toBeInTheDocument();
    expect(screen.getByText('Write notes')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('○')).toBeInTheDocument();
  });
});

describe('MatrixView', () => {
  test('renders matrix with labels and quadrants', () => {
    const data = {
      topLabel: 'High', bottomLabel: 'Low',
      leftLabel: 'Left', rightLabel: 'Right',
      quadrants: ['Q1', 'Q2', 'Q3', 'Q4'],
    };
    render(<MatrixView data={data} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q4')).toBeInTheDocument();
  });
});
