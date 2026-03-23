/**
 * TutorActivity — rich, multi-phase status indicator.
 *
 * Redesigned from a single dot+label to a warm, informative presence
 * that shows the tutor's thinking process without demanding attention.
 *
 * Three visual modes:
 *   1. Single step: dot + label (like before, for simple responses)
 *   2. Streaming: animated writing indicator with character count
 *   3. Multi-step: vertical pipeline showing completed/active/pending
 *
 * The indicator should feel like watching a craftsperson work —
 * you can see what they're doing, but it doesn't interrupt you.
 */
import { useSyncExternalStore } from 'react';
import { getSessionState, subscribeSessionState } from '@/state';
import type { TutorActivityDetail } from '@/state';
import styles from './TutorActivity.module.css';

const STEP_LABELS: Record<string, string> = {
  routing: 'reading your thoughts',
  researching: 'researching',
  thinking: 'thinking',
  'searching-graph': 'exploring connections',
  streaming: 'writing',
  visualizing: 'composing a visualization',
  illustrating: 'sketching',
  reflecting: 'reflecting',
  refining: 'refining',
  enriching: 'enriching',
};

/** Icon per step — quiet, typographic. */
const STEP_ICON: Record<string, string> = {
  routing: '·',
  researching: '◈',
  thinking: '·',
  'searching-graph': '⟷',
  streaming: '✎',
  visualizing: '◉',
  illustrating: '✎',
  reflecting: '·',
  refining: '·',
  enriching: '·',
};

function selectActivity(): TutorActivityDetail | null {
  const s = getSessionState();
  if (!s.isThinking && !s.isStreaming) return null;
  return s.activityDetail;
}

export function TutorActivity() {
  const activity = useSyncExternalStore(subscribeSessionState, selectActivity);

  if (!activity) return null;

  const label = activity.label || STEP_LABELS[activity.step] || 'thinking';
  const icon = STEP_ICON[activity.step] || '·';
  const hasProgress = activity.iteration != null && activity.maxIterations != null;
  const isStreaming = activity.step === 'streaming';

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={isStreaming ? styles.dotStreaming : styles.dot} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
      {hasProgress && (
        <span className={styles.progress}>
          {activity.iteration}/{activity.maxIterations}
        </span>
      )}
      {isStreaming && <span className={styles.writingBar} aria-hidden="true" />}
    </div>
  );
}
