/**
 * LandingDemoConstellation — animated constellation scene.
 * Shows lexicon terms with mastery bars and thinker encounters,
 * demonstrating the knowledge-tracking surface.
 */
import { useState, useEffect } from 'react';
import styles from './LandingDemoConstellation.module.css';

const TERMS = [
  { word: 'ellipse', def: 'a closed curve where the sum of distances from two foci is constant', mastery: 0.72, level: 'developing' },
  { word: 'harmonic', def: 'relating to a series of quantities whose reciprocals form an arithmetic progression', mastery: 0.45, level: 'exploring' },
  { word: 'empiricism', def: 'knowledge grounded in observation rather than theory alone', mastery: 0.88, level: 'strong' },
];

const THINKERS = [
  { name: 'Johannes Kepler', gift: 'the courage to trust data over beauty', status: 'active' },
  { name: 'Tycho Brahe', gift: 'precision as a form of devotion', status: 'bridged' },
  { name: 'Isaac Newton', gift: 'unification of terrestrial and celestial', status: 'dormant' },
];

interface Props { active: boolean; }

export function LandingDemoConstellation({ active }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!active) { setRevealed(false); return; }
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className={styles.constellation}>
      {/* Sub-nav tabs */}
      <div className={styles.subNav}>
        <span className={styles.subTab}>overview</span>
        <span className={`${styles.subTab} ${styles.subTabActive}`}>lexicon</span>
        <span className={styles.subTab}>encounters</span>
        <span className={styles.subTab}>library</span>
      </div>

      <div className={styles.columns}>
        {/* Lexicon column */}
        <div className={styles.col}>
          <div className={styles.colLabel}>your lexicon</div>
          {TERMS.map((term, i) => (
            <div
              key={term.word}
              className={`${styles.termCard} ${revealed ? styles.revealed : ''}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={styles.termWord}>{term.word}</div>
              <div className={styles.termDef}>{term.def}</div>
              <div className={styles.masteryRow}>
                <div className={styles.masteryTrack}>
                  <div
                    className={styles.masteryFill}
                    style={{ width: revealed ? `${term.mastery * 100}%` : '0%' }}
                  />
                </div>
                <span className={styles.masteryLevel}>{term.level}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Thinkers column */}
        <div className={styles.col}>
          <div className={styles.colLabel}>thinkers encountered</div>
          {THINKERS.map((t, i) => (
            <div
              key={t.name}
              className={`${styles.thinkerCard} ${revealed ? styles.revealed : ''}`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              <div className={styles.thinkerName}>{t.name}</div>
              <div className={styles.thinkerGift}>{t.gift}</div>
              <div className={`${styles.thinkerStatus} ${styles[t.status]}`}>
                {t.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
