/**
 * LandingHero — the atmospheric opening, now a split layout.
 * Left: title, tagline, call to action.
 * Right: a perspective-framed notebook demo, live on first load.
 *
 * was: centered title only, demo buried below the fold
 * now: the notebook is visible from the first screen
 * reason: show what Ember *is* immediately, not just what it's called
 */
import { useEffect, useState } from 'react';
import { LandingDemoNotebook } from './LandingDemoNotebook';
import styles from './LandingHero.module.css';

export function LandingHero() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={styles.hero} aria-label="Ember — introduction">
      {/* Left column: the quiet opening */}
      <div className={`${styles.content} ${revealed ? styles.revealed : ''}`}>
        <span className={styles.timestamp}>a quiet room</span>
        <h1 className={styles.title}>
          Silence is the{' '}
          <em className={styles.titleEmphasis}>beginning</em>{' '}
          of depth.
        </h1>
        <p className={styles.tagline}>
          An unhurried learning environment where a brilliant, patient
          mind follows your curiosity — and never moves on until
          understanding is real.
        </p>
        <div className={styles.cursor} aria-hidden="true" />
      </div>

      {/* Right column: the notebook in action */}
      <div className={`${styles.frameWrap} ${revealed ? styles.frameRevealed : ''}`}>
        <div className={styles.frame}>
          <div className={styles.titleBar}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.barLabel}>ember</span>
          </div>
          <div className={styles.viewport}>
            <LandingDemoNotebook active={revealed} />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className={`${styles.scrollHint} ${revealed ? styles.hintRevealed : ''}`}>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
