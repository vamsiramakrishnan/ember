/**
 * StreamingText — the tutor's response as it comes into being.
 *
 * The streaming entry IS the thinking indicator. No separate
 * peripheral component needed. The narration appears inline as
 * ghost-weight tutor text — the tutor whispering what they're
 * about to write before the actual response arrives.
 *
 * Phases:
 *   1. Arriving — left rule fades in, narration appears as whisper
 *   2. Composing — structured output detected, skeleton placeholder
 *   3. Writing — streaming text replaces narration, continuous flow
 *   4. Done — cursor disappears, rule solidifies
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useDeferredValue, useState, useEffect } from 'react';
import { MarkdownContent } from '@/primitives/MarkdownContent';
import { useSemanticBuffer, pendingLabel } from '@/hooks/useSemanticBuffer';
import { subscribeNarration, getCurrentNarration } from '@/services/status-narrator';
import { getSessionState } from '@/state/session-state';
import styles from './StreamingText.module.css';

interface StreamingTextProps {
  children: string;
  done: boolean;
}

/** Step labels — shown when Gemma narration hasn't arrived yet. */
const STEP_WHISPERS: Record<string, string> = {
  routing: 'reading...',
  researching: 'looking something up...',
  thinking: 'considering...',
  'searching-graph': 'tracing connections...',
  streaming: 'writing...',
  visualizing: 'sketching...',
  illustrating: 'drawing...',
  reflecting: 'looking back...',
  refining: 'refining...',
  enriching: 'gathering context...',
};

function unwrapJson(text: string): string | 'composing' | null {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) return null;
  if (!/["']type["']\s*:\s*["']/.test(trimmed)) return null;
  const m = trimmed.match(
    /["']content["']\s*:\s*["']([\s\S]*?)(?:["'](?:\s*[,}])|$)/,
  );
  if (m?.[1]) {
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
      .replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return 'composing';
}

/** Detect what structured type is being composed from partial JSON. */
function detectComposingType(text: string): string | null {
  const m = text.match(/["']type["']\s*:\s*["']([^"']+)["']/);
  return m?.[1] ?? null;
}

/** Subscribe to narration and return current text. */
function useNarration(active: boolean): string {
  const [narration, setNarration] = useState(getCurrentNarration);
  useEffect(() => {
    if (!active) { setNarration(''); return; }
    setNarration(getCurrentNarration());
    return subscribeNarration(setNarration);
  }, [active]);
  return narration;
}

/** Get the current step whisper from session state. */
function useStepWhisper(active: boolean): string {
  const [whisper, setWhisper] = useState('');
  useEffect(() => {
    if (!active) { setWhisper(''); return; }
    const check = () => {
      const s = getSessionState();
      const step = s.activityDetail?.step;
      setWhisper(step ? (STEP_WHISPERS[step] ?? '') : '');
    };
    check();
    const id = setInterval(check, 400);
    return () => clearInterval(id);
  }, [active]);
  return whisper;
}

export function StreamingText({ children, done }: StreamingTextProps) {
  const deferred = useDeferredValue(children);
  const hasContent = children.length > 0;
  const isActive = !done;

  const narration = useNarration(isActive && !hasContent);
  const stepWhisper = useStepWhisper(isActive && !hasContent && !narration);

  // The whisper: narration from Gemma, or fallback step label
  const whisperText = narration || stepWhisper;

  // Phase 1: Arriving — rule fades in, narration whispers
  if (!hasContent && !done) {
    return (
      <div className={styles.container} aria-busy="true"
        aria-label="Tutor is thinking">
        <div className={styles.ruleArriving} />
        <div className={styles.body}>
          {whisperText && (
            <span className={styles.whisper}>{whisperText}</span>
          )}
          <span className={styles.cursor} aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Phase 2: Composing structured output — show skeleton
  if (!done) {
    const unwrapped = unwrapJson(deferred);
    if (unwrapped === 'composing') {
      const composingType = detectComposingType(deferred);
      return (
        <div className={styles.container} aria-busy="true"
          aria-label="Tutor is composing">
          <div className={styles.ruleStreaming} />
          <div className={styles.body}>
            <ComposingSkeleton type={composingType} />
          </div>
        </div>
      );
    }
    if (unwrapped) {
      return <StreamBody text={unwrapped} done={false} />;
    }
  }

  // Phase 3/4: Writing / Done
  return <StreamBody text={done ? children : deferred} done={done} />;
}

/** Inner component that applies semantic buffering to visible text. */
function StreamBody({ text, done }: { text: string; done: boolean }) {
  const { visible, pending } = useSemanticBuffer(text, done);
  const label = pendingLabel(pending);
  const ruleCls = done ? styles.rule : styles.ruleStreaming;

  return (
    <div className={styles.container} aria-live="polite" aria-busy={!done}>
      <div className={ruleCls} />
      <div className={styles.body}>
        <div className={styles.text}>
          <MarkdownContent>{visible}</MarkdownContent>
        </div>
        {label && <span className={styles.composingLabel}>{label}</span>}
        {!done && <span className={styles.cursor} aria-hidden="true" />}
      </div>
    </div>
  );
}

/** Skeleton placeholder for structured content being composed. */
function ComposingSkeleton({ type }: { type: string | null }) {
  if (type === 'concept-diagram') {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonNodes}>
          <div className={styles.skeletonNode} />
          <div className={styles.skeletonEdge} />
          <div className={styles.skeletonNode} />
          <div className={styles.skeletonEdge} />
          <div className={styles.skeletonNode} />
        </div>
        <span className={styles.skeletonLabel}>composing diagram…</span>
      </div>
    );
  }

  if (type === 'thinker-card') {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonThinker}>
          <div className={styles.skeletonCircle} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '35%' }} />
          </div>
        </div>
        <span className={styles.skeletonLabel}>introducing a thinker…</span>
      </div>
    );
  }

  // Generic composing state
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonLines}>
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '55%' }} />
      </div>
      <span className={styles.skeletonLabel}>composing…</span>
    </div>
  );
}
