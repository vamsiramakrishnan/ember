/**
 * ResponsePlanPreview — progressive execution roadmap.
 *
 * When a student submits a compound command (action + format, or workflow),
 * this component shows a live pipeline of what's happening:
 *
 *   · researching              (pending)
 *   › formatting as slides…    (active, pulsing)
 *   ✓ done                     (complete, sage)
 *
 * For workflows, shows the expanded chain so students understand
 * what each preset verb actually does under the hood.
 *
 * Visually: IBM Plex Mono 10px, ink-ghost, left-aligned with the
 * margin rule. Feels like a tutor's mental checklist — visible but
 * not demanding attention.
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
  error: '×',
};

/** Map DAG action types to concise, human-friendly labels. */
const ACTION_LABELS: Record<string, string> = {
  respond: 'writing',
  research: 'researching',
  explain: 'explaining',
  define: 'defining',
  compare: 'comparing',
  connect: 'connecting',
  summarize: 'summarizing',
  visualize: 'diagramming',
  draw: 'sketching',
  timeline: 'building timeline',
  teach: 'preparing material',
  podcast: 'producing audio',
  flashcards: 'creating cards',
  exercise: 'designing exercises',
  quiz: 'preparing quiz',
  deepen: 'enriching',
  illustrate: 'illustrating',
  // Output format verbs
  slides: 'formatting as slides',
  doc: 'formatting as document',
  notes: 'condensing into notes',
  brief: 'writing brief',
  silence: '',
};

function stepLabel(plan: ResponsePlan): string {
  return ACTION_LABELS[plan.responseType] ?? plan.label;
}

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
        {plans.map((plan, i) => {
          const label = stepLabel(plan);
          const isLast = i === plans.length - 1;
          return (
            <div
              key={plan.intentId}
              className={`${styles.step} ${styles[plan.status]}`}
            >
              <span className={styles.icon}>{STATUS_ICON[plan.status]}</span>
              <span className={styles.label}>{label}</span>
              {!isLast && plan.status === 'complete' && (
                <span className={styles.connector} aria-hidden="true">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
