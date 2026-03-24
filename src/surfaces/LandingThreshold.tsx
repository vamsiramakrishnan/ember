/**
 * LandingThreshold — the sign-in / student selection at the bottom.
 * The threshold you cross to enter the notebook.
 * Wraps LandingStudentList and OAuth buttons.
 */
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { LandingStudentList } from './LandingStudentList';
import type { OAuthProvider } from '@/auth';
import type { StudentRecord } from '@/persistence/records';
import styles from './LandingThreshold.module.css';

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'github', label: 'GitHub' },
  { id: 'twitter', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
];

interface Props {
  students: StudentRecord[];
  onSelect: (student: StudentRecord) => void;
  isConfigured: boolean;
  isAuthenticated: boolean;
  signInWithOAuth: (provider: OAuthProvider) => void;
}

export function LandingThreshold({
  students, onSelect, isConfigured, isAuthenticated, signInWithOAuth,
}: Props) {
  const [ref, visible] = useScrollReveal(0.15);

  return (
    <section
      ref={ref}
      className={`${styles.threshold} ${visible ? styles.visible : ''}`}
      aria-label="Begin"
    >
      <div className={styles.column}>
        <div className={styles.rule} />

        {isConfigured && !isAuthenticated && (
          <div className={styles.oauthSection}>
            <div className={styles.label}>sign in</div>
            <div className={styles.oauthGrid}>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={styles.oauthButton}
                  onClick={() => signInWithOAuth(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className={styles.dividerRow}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or continue locally</span>
              <span className={styles.dividerLine} />
            </div>
          </div>
        )}

        <LandingStudentList students={students} onSelect={onSelect} />
      </div>
    </section>
  );
}
