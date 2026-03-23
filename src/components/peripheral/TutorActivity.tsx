/**
 * TutorActivity — quiet status indicator showing what the tutor is doing.
 * Appears below the streaming text / above the InputZone when the tutor
 * is active. Uses the session state's activityDetail for granular steps.
 *
 * Design: whisper-quiet, IBM Plex Mono 10px, ink-ghost colour, subtle
 * fade animation. Feels like a distant typewriter, not a loading spinner.
 */
import { useSyncExternalStore } from 'react';
import { getSessionState, subscribeSessionState } from '@/state';
import type { TutorActivityDetail } from '@/state';
import styles from './TutorActivity.module.css';

const STEP_LABELS: Record<string, string> = {
  routing: 'reading…',
  researching: 'researching…',
  thinking: 'thinking…',
  'searching-graph': 'exploring connections…',
  streaming: 'writing…',
  visualizing: 'composing a visualization…',
  illustrating: 'sketching…',
  reflecting: 'reflecting…',
  refining: 'refining…',
  enriching: 'enriching…',
};

function selectActivity(): TutorActivityDetail | null {
  const s = getSessionState();
  if (!s.isThinking && !s.isStreaming) return null;
  return s.activityDetail;
}

export function TutorActivity() {
  const activity = useSyncExternalStore(subscribeSessionState, selectActivity);

  if (!activity) return null;

  const label = activity.label || STEP_LABELS[activity.step] || 'thinking…';
  const hasProgress = activity.iteration != null && activity.maxIterations != null;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      {hasProgress && (
        <span className={styles.progress}>
          {activity.iteration}/{activity.maxIterations}
        </span>
      )}
    </div>
  );
}
