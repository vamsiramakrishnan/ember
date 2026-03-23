/**
 * ResponsePlanPreview — quiet preview of planned multi-intent responses.
 *
 * When a student submits compound input, this component shows a brief
 * roadmap of what the tutor will produce. Each step appears as a
 * single line in system font, cycling through states:
 *   pending → active (with subtle pulse) → complete (checkmark)
 *
 * Visually: IBM Plex Mono 10px, ink-ghost, left-aligned with the
 * margin rule. The plan feels like a tutor's mental checklist —
 * visible but not demanding attention.
 *
 * This component is the UI manifestation of the IntentDAG. It gives
 * the student agency: they can see what's happening and understand
 * that their compound request was understood, not flattened.
 */
import type { ResponsePlan } from '@/hooks/useResponseOrchestrator';
import styles from './ResponsePlanPreview.module.css';

interface ResponsePlanPreviewProps {
  plans: ResponsePlan[];
}

const STATUS_ICON: Record<ResponsePlan['status'], string> = {
  pending: '·',
  active: '›',
  complete: '✓',
};

export function ResponsePlanPreview({ plans }: ResponsePlanPreviewProps) {
  if (plans.length === 0) return null;

  const allComplete = plans.every((p) => p.status === 'complete');
  if (allComplete) return null;

  return (
    <div
      className={styles.container}
      role="status"
      aria-label="Tutor response plan"
      aria-live="polite"
    >
      <div className={styles.rule} />
      <div className={styles.steps}>
        {plans.map((plan) => (
          <div
            key={plan.intentId}
            className={`${styles.step} ${styles[plan.status]}`}
          >
            <span className={styles.icon}>{STATUS_ICON[plan.status]}</span>
            <span className={styles.label}>{plan.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
