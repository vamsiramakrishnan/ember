/**
 * Landing — the quiet threshold.
 * Sign in with OAuth (Google, Apple, GitHub, X, Facebook) when
 * Supabase is configured, or enter locally with just a name.
 */
import { useState, useEffect, useCallback } from 'react';
import { Store, notify } from '@/persistence';
import { getAllStudents, createStudent } from '@/persistence/repositories/students';
import { useStudent } from '@/contexts/StudentContext';
import { useAuth } from '@/auth';
import { LandingStudentList } from './LandingStudentList';
import type { OAuthProvider } from '@/auth';
import type { StudentRecord } from '@/persistence/records';
import styles from './Landing.module.css';

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'github', label: 'GitHub' },
  { id: 'twitter', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
];

export function Landing() {
  const { setStudent } = useStudent();
  const { isConfigured, isAuthenticated, user, signInWithOAuth } = useAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStudents().then((s) => { setStudents(s); setLoading(false); });
  }, []);

  // When OAuth user arrives, auto-create or find student
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const userName = user.user_metadata?.full_name as string
      ?? user.user_metadata?.name as string
      ?? user.email?.split('@')[0]
      ?? 'Student';
    getAllStudents().then(async (existing) => {
      const match = existing.find((s) => s.name === userName);
      if (match) { setStudent(match); return; }
      const student = await createStudent({ name: userName, displayName: userName });
      notify(Store.Students);
      setStudent(student);
    });
  }, [isAuthenticated, user, setStudent]);

  const handleSelect = useCallback((student: StudentRecord) => {
    setStudent(student);
  }, [setStudent]);

  if (loading) return null;

  return (
    <div className={styles.landing}>
      <h1 className={styles.title}>ember</h1>
      <p className={styles.subtitle}>a quiet room with a good mind in it</p>

      {isConfigured && !isAuthenticated && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Sign in</div>
          <div className={styles.oauthGrid}>
            {PROVIDERS.map((p) => (
              <button key={p.id} className={styles.oauthButton} onClick={() => signInWithOAuth(p.id)}>
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

      <LandingStudentList students={students} onSelect={handleSelect} />

      <div className={styles.epigraph}>
        <p className={styles.quote}>
          What if every child had a tutor who followed their curiosity,
          knew them deeply, and never moved on until understanding was real?
        </p>
        <p className={styles.attribution}>The question Ember exists to answer</p>
      </div>
    </div>
  );
}
