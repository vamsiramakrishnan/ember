/**
 * VoiceMode — bidirectional voice interface overlay.
 *
 * A warm modal that rises from the InputZone when activated.
 * Shows live transcripts, a waveform indicator, and session timer.
 * The notebook remains visible (dimmed) behind it, filling with
 * entries as the tutor calls addNotebookEntry during conversation.
 *
 * See: useVoiceSession for the Live API connection.
 */
import { useRef, useEffect } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);

  if (state === 'idle') return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* Header: status + timer + end button */}
        <div className={styles.header}>
          <div className={styles.statusRow}>
            <div className={`${styles.statusDot} ${
              state === 'active' ? (isTutorSpeaking ? styles.speaking : styles.listening)
              : state === 'connecting' ? styles.connecting
              : ''
            }`} />
            <span className={styles.statusLabel}>
              {state === 'connecting' ? 'connecting…'
                : isTutorSpeaking ? 'tutor speaking'
                : 'listening'}
            </span>
          </div>
          <span className={styles.timer}>{formatElapsed(elapsed)}</span>
          <button className={styles.endButton} onClick={onStop}>
            end session
          </button>
        </div>

        {/* Waveform visualizer */}
        <div className={styles.waveform}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.bar} ${isTutorSpeaking ? styles.barActive : ''}`}
              style={{
                animationDelay: `${i * 0.05}s`,
                height: isTutorSpeaking
                  ? `${12 + Math.sin(i * 0.7) * 8 + Math.random() * 6}px`
                  : '3px',
              }}
            />
          ))}
        </div>

        {/* Live transcript */}
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

        {/* Error message */}
        {error && <p className={styles.error}>{error}</p>}

        {/* Quiet hint */}
        <p className={styles.hint}>
          Your notebook is being updated as you talk. Speak naturally — interrupt anytime.
        </p>
      </div>
    </div>
  );
}
