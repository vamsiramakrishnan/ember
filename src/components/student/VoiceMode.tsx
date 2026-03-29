/**
 * VoiceMode — non-blocking voice bar + expandable transcript.
 *
 * Redesigned: the old modal overlay blocked the notebook. The new design
 * is a compact bottom bar (like a music player) that lets the student
 * browse the notebook, constellation, and graph while talking.
 *
 * Two states:
 * - Collapsed: thin bar with status dot, waveform, timer, end button
 * - Expanded: bar + scrollable transcript drawer (tap bar to toggle)
 *
 * The notebook remains fully interactive underneath.
 */
import { useRef, useEffect, useState } from 'react';
import type { TranscriptLine, VoiceSessionState } from '@/hooks/useVoiceSession';
import styles from './VoiceMode.module.css';

interface VoiceModeProps {
  state: VoiceSessionState;
  transcript: TranscriptLine[];
  isTutorSpeaking: boolean;
  elapsed: number;
  error: string | null;
  onStop: () => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceMode({
  state, transcript, isTutorSpeaking, elapsed, error, onStop,
}: VoiceModeProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom when expanded
  useEffect(() => {
    if (!expanded) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript, expanded]);

  if (state === 'idle') return null;

  const statusClass = state === 'active'
    ? (isTutorSpeaking ? styles.speaking : styles.listening)
    : state === 'connecting' ? styles.connecting
    : '';

  const statusText = state === 'connecting' ? 'connecting'
    : isTutorSpeaking ? 'speaking' : 'listening';

  return (
    <div className={`${styles.container} ${expanded ? styles.expanded : ''}`}>
      {/* Expandable transcript drawer */}
      {expanded && (
        <div className={styles.drawer}>
          <div className={styles.transcript} ref={scrollRef}>
            {transcript.length === 0 && state === 'active' && (
              <p className={styles.empty}>
                Start speaking — your conversation will appear here.
              </p>
            )}
            {transcript.map((line, i) => (
              <div
                key={i}
                className={line.role === 'user' ? styles.userLine : styles.tutorLine}
              >
                <span className={styles.lineRole}>
                  {line.role === 'user' ? 'you' : 'tutor'}
                </span>
                <p className={styles.lineText}>{line.text}</p>
              </div>
            ))}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}

      {/* Compact voice bar — always visible */}
      <div className={styles.bar} onClick={() => setExpanded(!expanded)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setExpanded(!expanded); }}
        aria-label={expanded ? 'Collapse transcript' : 'Expand transcript'}
        aria-expanded={expanded}
      >
        {/* Status dot */}
        <div className={`${styles.statusDot} ${statusClass}`} />

        {/* Status label */}
        <span className={styles.statusLabel}>{statusText}</span>

        {/* Waveform — compact, 12 bars */}
        <div className={styles.waveform}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.waveBar} ${isTutorSpeaking ? styles.waveBarActive : ''}`}
              style={{
                animationDelay: `${i * 0.06}s`,
                height: isTutorSpeaking
                  ? `${8 + Math.sin(i * 0.8) * 5 + Math.random() * 3}px`
                  : '2px',
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <span className={styles.timer}>{formatElapsed(elapsed)}</span>

        {/* Expand/collapse chevron */}
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}>
          ▾
        </span>

        {/* End button */}
        <button className={styles.endButton} onClick={(e) => { e.stopPropagation(); onStop(); }}
          aria-label="End voice session">
          end
        </button>
      </div>
    </div>
  );
}
