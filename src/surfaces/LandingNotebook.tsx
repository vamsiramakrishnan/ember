/**
 * LandingNotebook — a visual demo of the notebook interface.
 * Shows a student-tutor exchange with marginalia in the right margin,
 * demonstrating the core interaction: student writes, tutor annotates.
 * Entries reveal with staggered timing when scrolled into view.
 */
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './LandingNotebook.module.css';

const EXCHANGES = [
  {
    student: 'I keep thinking about how Kepler spent years trying to make the orbits circular. He had the data — Tycho\'s observations were precise. But he couldn\'t let go of the idea that God would use perfect shapes.',
    tutor: 'Notice what you just said: he had the data. What made the circles feel more true than the ellipses?',
  },
  {
    student: 'Beauty? He believed the universe had to be geometrically elegant. Circles are simpler than ellipses. He wanted the math to be — harmonious.',
    tutor: 'And when he finally accepted the ellipses, did the harmony disappear?',
  },
  {
    student: 'No — he found a different kind. The equal-area law. The relationship between orbital period and distance. The harmony was real, just not the kind he expected.',
    tutor: null,
  },
] as const;

export function LandingNotebook() {
  const [ref, visible] = useScrollReveal(0.1);

  return (
    <section
      ref={ref}
      className={`${styles.section} ${visible ? styles.visible : ''}`}
      aria-label="How Ember works"
    >
      <div className={styles.label}>the notebook</div>
      <div className={styles.notebook}>
        <div className={styles.page}>
          {EXCHANGES.map((ex, i) => (
            <div
              key={i}
              className={styles.exchange}
              style={{ transitionDelay: `${300 + i * 400}ms` }}
            >
              <p className={styles.studentText}>{ex.student}</p>
              {ex.tutor && (
                <div className={styles.marginNote}>
                  <div className={styles.marginRule} aria-hidden="true" />
                  <p className={styles.tutorText}>{ex.tutor}</p>
                </div>
              )}
            </div>
          ))}
          <div
            className={styles.silenceRow}
            style={{ transitionDelay: '1500ms' }}
          >
            <span className={styles.silenceCursor} aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className={styles.caption}>
        Your thinking is the primary text. The tutor's voice lives in the margins.
      </p>
    </section>
  );
}
