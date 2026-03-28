import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ResponsePlanPreview } from '../ResponsePlanPreview';
import type { ResponsePlan } from '@/hooks/useResponseOrchestrator';

describe('ResponsePlanPreview', () => {
  test('renders pending plans', () => {
    const plans: ResponsePlan[] = [
      { intentId: '1', label: 'Explain concept', responseType: 'marginalia', status: 'pending' },
      { intentId: '2', label: 'Draw diagram', responseType: 'diagram', status: 'active' },
    ];
    render(<ResponsePlanPreview plans={plans} />);
    expect(screen.getByText('Explain concept')).toBeInTheDocument();
    expect(screen.getByText('Draw diagram')).toBeInTheDocument();
  });

  test('shows status icons', () => {
    const plans: ResponsePlan[] = [
      { intentId: '1', label: 'Step 1', responseType: 't', status: 'pending' },
      { intentId: '2', label: 'Step 2', responseType: 't', status: 'active' },
    ];
    render(<ResponsePlanPreview plans={plans} />);
    expect(screen.getByText('·')).toBeInTheDocument();
    expect(screen.getByText('›')).toBeInTheDocument();
  });

  test('returns null for empty plans', () => {
    const { container } = render(<ResponsePlanPreview plans={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('returns null when all plans complete', () => {
    const plans: ResponsePlan[] = [
      { intentId: '1', label: 'Done', responseType: 't', status: 'complete' },
    ];
    const { container } = render(<ResponsePlanPreview plans={plans} />);
    expect(container.firstChild).toBeNull();
  });

  test('has status role', () => {
    const plans: ResponsePlan[] = [
      { intentId: '1', label: 'Processing', responseType: 't', status: 'active' },
    ];
    render(<ResponsePlanPreview plans={plans} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    const plans: ResponsePlan[] = [
      { intentId: '1', label: 'Step', responseType: 't', status: 'pending' },
    ];
    render(<ResponsePlanPreview plans={plans} />);
    expect(screen.getByLabelText('Tutor response plan')).toBeInTheDocument();
  });
});
