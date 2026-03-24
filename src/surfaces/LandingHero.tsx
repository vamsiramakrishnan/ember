/**
 * LandingHero — the atmospheric opening.
 * "ember" in large Cormorant Garamond, the tagline beneath,
 * and a gentle downward arrow that invites scrolling.
 * The reading lamp glow comes from Shell; this adds the title moment.
 */
import { useEffect, useState } from 'react';
import styles from './LandingHero.module.css';

export function LandingHero() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Small delay so the title fades in after the page loads
    const t = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={styles.hero} aria-label="Ember — introduction">
      <div className={`${styles.content} ${revealed ? styles.revealed : ''}`}>
        <h1 className={styles.title}>ember</h1>
        <p className={styles.tagline}>
          a quiet room with a good mind in it
        </p>
        <div className={styles.cursor} aria-hidden="true" />
      </div>
      <div className={`${styles.scrollHint} ${revealed ? styles.hintRevealed : ''}`}>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
