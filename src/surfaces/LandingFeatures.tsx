/**
 * LandingFeatures — three quiet cards describing what makes Ember different.
 * Inspired by the prototype's feature grid but rendered in Ember's
 * typography and token system. No icons, no images — just words.
 */
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './LandingFeatures.module.css';

const FEATURES = [
  {
    label: 'cadence',
    title: 'Analog Cadence',
    body: 'A writing interface that rewards the pause. No notifications, no word counts, just the rhythm of thought arriving at its own pace.',
  },
  {
    label: 'memory',
    title: 'Deep Archive',
    body: 'Your library grows organically. Semantic linking that feels like a shared memory between your past and present self.',
  },
  {
    label: 'grace',
    title: 'Editorial Grace',
    body: 'Beautiful typography and generous spacing create a sanctuary for concentrated intellect. The page itself is the interface.',
  },
] as const;

export function LandingFeatures() {
  return (
    <section className={styles.section} aria-label="Features">
      <div className={styles.grid}>
        {FEATURES.map((f, i) => (
          <Feature key={f.label} {...f} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}

function Feature({ label, title, body, delay }: {
  label: string; title: string; body: string; delay: number;
}) {
  const [ref, visible] = useScrollReveal(0.15);
  return (
    <div
      ref={ref}
      className={`${styles.card} ${visible ? styles.visible : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className={styles.label}>{label}</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
