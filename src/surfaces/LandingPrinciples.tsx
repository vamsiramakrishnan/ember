/**
 * LandingPrinciples — three quiet statements about what makes Ember different.
 * Each principle is a margin note paired with a student-voice elaboration,
 * mirroring the notebook's own visual language.
 */
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './LandingPrinciples.module.css';

const PRINCIPLES = [
  {
    margin: 'silence is a feature',
    body: 'After asking a question, the tutor goes quiet. No hints, no nudges, no loading spinners. A blinking cursor and nothing else. This is where thinking happens.',
  },
  {
    margin: 'mastery is invisible',
    body: 'The system measures deeply what you understand — but never shows you a score. You feel mastery when the questions get harder, the connections stretch further, and the tutor trusts you with more.',
  },
  {
    margin: 'every idea has a person',
    body: 'When a concept enters your world, it arrives with the person who discovered it. You are not learning alone. You are joining a conversation that has been going on for centuries.',
  },
] as const;

export function LandingPrinciples() {
  return (
    <section className={styles.section} aria-label="Principles">
      <div className={styles.column}>
        {PRINCIPLES.map((p, i) => (
          <Principle key={i} margin={p.margin} body={p.body} delay={i * 150} />
        ))}
      </div>
    </section>
  );
}

function Principle({ margin, body, delay }: {
  margin: string; body: string; delay: number;
}) {
  const [ref, visible] = useScrollReveal(0.2);
  return (
    <div
      ref={ref}
      className={`${styles.principle} ${visible ? styles.visible : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={styles.marginLabel}>{margin}</div>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
