/**
 * TutorActivity — rich, multi-phase status indicator.
 *
 * Three visual modes:
 *   1. Single step: dot + label (simple responses)
 *   2. Streaming: animated writing indicator
 *   3. Narrated: Gemma streams a contextual description of what
 *      the tutor is doing (replaces static label when available)
 *
 * The indicator should feel like watching a craftsperson work —
 * you can see what they're doing, but it doesn't interrupt you.
 */
import { useSyncExternalStore } from 'react';
import { getSessionState, subscribeSessionState } from '@/state';
import type { TutorActivityDetail } from '@/state';
import { StatusNarrator } from './StatusNarrator';
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

/** Steps where Gemma narration adds value (longer-running). */
const NARRATED_STEPS = new Set([
  'researching', 'thinking', 'searching-graph',
  'visualizing', 'illustrating', 'reflecting', 'refining',
]);

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
  const showNarration = NARRATED_STEPS.has(activity.step);

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <span className={isStreaming ? styles.dotStreaming : styles.dot} aria-hidden="true">
        {icon}
      </span>
      {showNarration ? (
        <NarrationWithFallback fallbackLabel={label} />
      ) : (
        <span className={styles.label}>{label}</span>
      )}
      {hasProgress && (
        <span className={styles.progress}>
          {activity.iteration}/{activity.maxIterations}
        </span>
      )}
      {isStreaming && <span className={styles.writingBar} aria-hidden="true" />}
    </div>
  );
}

/** Show Gemma narration if available, otherwise the static label. */
function NarrationWithFallback({ fallbackLabel }: { fallbackLabel: string }) {
  return (
    <>
      <StatusNarrator />
      <NarrationFallbackLabel label={fallbackLabel} />
    </>
  );
}

/**
 * Shows the static label only when narration is empty.
 * Uses CSS: hidden when a sibling .narration element is visible.
 */
function NarrationFallbackLabel({ label }: { label: string }) {
  return (
    <span className={styles.labelFallback}>{label}</span>
  );
}
