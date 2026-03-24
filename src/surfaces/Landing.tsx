/**
 * Landing — the scroll-driven introduction to Ember.
 * Four sections unfold like opening a book: hero, philosophy,
 * notebook demo, and the threshold to enter.
 */
import { useState, useEffect, useCallback } from 'react';
import { getAllStudents, createStudent } from '@/persistence/repositories/students';
import { Store, notify } from '@/persistence';
import { useStudent } from '@/contexts/StudentContext';
import { useAuth } from '@/auth';
import { LandingHero } from './LandingHero';
import { LandingPhilosophy } from './LandingPhilosophy';
import { LandingNotebook } from './LandingNotebook';
import { LandingPrinciples } from './LandingPrinciples';
import { LandingThreshold } from './LandingThreshold';
import type { StudentRecord } from '@/persistence/records';
import styles from './Landing.module.css';

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
      <LandingHero />
      <LandingPhilosophy />
      <LandingNotebook />
      <LandingPrinciples />
      <LandingThreshold
        students={students}
        onSelect={handleSelect}
        isConfigured={isConfigured}
        isAuthenticated={isAuthenticated}
        signInWithOAuth={signInWithOAuth}
      />
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          ember — aristocratic tutoring for every child
        </p>
      </footer>
    </div>
  );
}
