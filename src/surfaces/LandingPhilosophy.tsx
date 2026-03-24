/**
 * LandingPhilosophy — three stanzas that unfold Ember's reason for being.
 * Each reveals on scroll, like turning pages in a quiet book.
 * The rhetoric: Bloom's proof → the aristocratic tutoring insight → the question.
 */
import { useScrollReveal } from '@/hooks/useScrollReveal';
import styles from './LandingPhilosophy.module.css';

interface StanzaProps {
  children: React.ReactNode;
  attribution?: string;
  delay?: number;
}

function Stanza({ children, attribution, delay = 0 }: StanzaProps) {
  const [ref, visible] = useScrollReveal(0.2);
  return (
    <div
      ref={ref}
      className={`${styles.stanza} ${visible ? styles.visible : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <blockquote className={styles.text}>{children}</blockquote>
      {attribution && (
        <cite className={styles.attribution}>{attribution}</cite>
      )}
    </div>
  );
}

export function LandingPhilosophy() {
  return (
    <section className={styles.philosophy} aria-label="Philosophy">
      <div className={styles.column}>
        <Stanza attribution="Benjamin Bloom, 1984">
          One-to-one tutoring produces students who perform two standard
          deviations above the average — better than 98% of those in
          conventional classrooms. This is not a hypothesis. It is a
          measured fact.
        </Stanza>

        <div className={styles.rule} />

        <Stanza attribution="The aristocratic tutoring insight" delay={100}>
          The conditions that developed Darwin, Lovelace, and Einstein
          were not genius alone — they were patient, responsive minds
          who met curiosity with more curiosity. A tutor who followed
          the student's question, not a syllabus.
        </Stanza>

        <div className={styles.rule} />

        <Stanza delay={200}>
          What if every child had access to the same conditions — a mind
          that knows them, remembers what they've been thinking about,
          and never moves on until understanding is real?
        </Stanza>

        <p className={styles.answer}>
          This is the question Ember exists to answer.
        </p>
      </div>
    </section>
  );
}
