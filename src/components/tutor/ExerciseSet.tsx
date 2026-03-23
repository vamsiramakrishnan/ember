/**
 * ExerciseSet — a sequence of Socratic exercises with progressive hints.
 * The student writes free-form responses; the tutor evaluates.
 * No multiple choice — exercises demand genuine reasoning.
 *
 * AI-generated block — produced by /exercise slash command.
 */
import { useState, useCallback } from 'react';
import type { Exercise, ExerciseDifficulty } from '@/types/entries';
import styles from './ExerciseSet.module.css';

interface ExerciseSetProps {
  title: string;
  exercises: Exercise[];
  difficulty: ExerciseDifficulty;
}

export function ExerciseSet({ title, exercises, difficulty }: ExerciseSetProps) {
  const [expanded, setExpanded] = useState(false);
  const [index, setIndex] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);

  const total = exercises.length;
  const ex = exercises[index];

  const nextEx = useCallback(() => {
    setHintsShown(0);
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  const prevEx = useCallback(() => {
    setHintsShown(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const showHint = useCallback(() => {
    setHintsShown((h) => h + 1);
  }, []);

  if (!expanded) {
    return (
      <div className={styles.container}>
        <button className={styles.header} onClick={() => setExpanded(true)}
          aria-label={`Expand exercises: ${title}`}>
          <span className={styles.icon}>?</span>
          <div className={styles.titleArea}>
            <span className={styles.title}>{title}</span>
            <span className={styles.badge}>{total} exercises</span>
            <span className={styles.diffBadge}>{difficulty}</span>
          </div>
          <span className={styles.hint}>click to practice</span>
        </button>
      </div>
    );
  }

  if (!ex) return null;
  const availableHints = ex.hints?.length ?? 0;

  return (
    <div className={styles.container}>
      <div className={styles.headerExpanded}>
        <span className={styles.title}>{title}</span>
        <span className={styles.diffBadge}>{difficulty}</span>
        <button className={styles.collapse} onClick={() => setExpanded(false)}
          aria-label="Collapse">↙</button>
      </div>

      <div className={styles.exerciseArea}>
        <div className={styles.formatLabel}>{ex.format.replace('-', ' ')}</div>
        <p className={styles.prompt}>{ex.prompt}</p>
        {ex.concept && <span className={styles.conceptTag}>{ex.concept}</span>}

        {/* Progressive hints */}
        {hintsShown > 0 && ex.hints && (
          <div className={styles.hints}>
            {ex.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className={styles.hintText}>↳ {h}</p>
            ))}
          </div>
        )}

        {availableHints > hintsShown && (
          <button className={styles.hintBtn} onClick={showHint}>
            show hint ({hintsShown + 1}/{availableHints})
          </button>
        )}
      </div>

      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={prevEx}
          disabled={index === 0}>←</button>
        <span className={styles.progress}>{index + 1} / {total}</span>
        <button className={styles.navBtn} onClick={nextEx}
          disabled={index === total - 1}>→</button>
      </div>
    </div>
  );
}
