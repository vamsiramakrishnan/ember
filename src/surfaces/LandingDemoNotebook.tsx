/**
 * LandingDemoNotebook — animated notebook scene.
 * Shows student typing with @mention chips and /commands,
 * followed by tutor marginalia appearing in response.
 */
import { useState, useEffect } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';
import styles from './LandingDemoNotebook.module.css';

/** Phases of the notebook animation. */
type Phase = 'typing' | 'chip' | 'command' | 'response' | 'silence';

const STUDENT_TEXT_PRE = 'I\u2019ve been reading about how ';
const STUDENT_TEXT_POST =
  ' struggled with circular orbits for years. He had Tycho\u2019s data\u2009—\u2009precise observations\u2009—\u2009but couldn\u2019t let go of the idea that God would use perfect shapes.';
const TUTOR_RESPONSE =
  'Notice what you just named: he had the data. What made circles feel more true than what the numbers said?';

const PHASE_TIMINGS: Record<Phase, number> = {
  typing: 0,
  chip: 3200,
  command: 6500,
  response: 8500,
  silence: 10500,
};

interface Props { active: boolean; }

export function LandingDemoNotebook({ active }: Props) {
  const [phase, setPhase] = useState<Phase>('typing');
  const typed = useTypewriter(STUDENT_TEXT_POST, phase !== 'typing' || !active, 28);

  useEffect(() => {
    if (!active) { setPhase('typing'); return; }
    const timers = (Object.entries(PHASE_TIMINGS) as [Phase, number][])
      .filter(([p]) => p !== 'typing')
      .map(([p, ms]) => setTimeout(() => setPhase(p), ms));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const showChip = phase !== 'typing';
  const showCmd = phase === 'command' || phase === 'response' || phase === 'silence';
  const showTutor = phase === 'response' || phase === 'silence';
  const showSilence = phase === 'silence';

  return (
    <div className={styles.notebook}>
      {/* Existing entry — already in the notebook */}
      <div className={styles.priorEntry}>
        <p className={styles.studentLine}>
          {STUDENT_TEXT_PRE}
          {showChip && <span className={styles.chipMention}>◈ Kepler</span>}
          {showChip ? typed : ''}
        </p>
      </div>

      {/* Command chip preview bar */}
      {showCmd && (
        <div className={`${styles.commandBar} ${styles.fadeIn}`}>
          <span className={styles.chipSlash}>
            <span className={styles.slashIcon}>◇</span>
            /explain
          </span>
          <span className={styles.commandHint}>unpack this concept in depth</span>
        </div>
      )}

      {/* Tutor response in margin */}
      {showTutor && (
        <div className={`${styles.tutorRow} ${styles.fadeIn}`}>
          <div className={styles.marginRule} />
          <p className={styles.tutorText}>{TUTOR_RESPONSE}</p>
        </div>
      )}

      {/* Silence cursor */}
      {showSilence && (
        <div className={`${styles.silenceRow} ${styles.fadeIn}`}>
          <span className={styles.cursor} />
        </div>
      )}

      {/* Input zone hint */}
      <div className={styles.inputHint}>
        <span className={styles.hintItem}>
          <span className={styles.hintKey}>/</span> commands
        </span>
        <span className={styles.hintItem}>
          <span className={styles.hintKey}>@</span> reference
        </span>
        <span className={styles.hintItem}>
          <span className={styles.hintKey}>?</span> ask tutor
        </span>
      </div>
    </div>
  );
}
