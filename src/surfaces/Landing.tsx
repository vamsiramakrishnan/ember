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
import type { OAuthProvider } from '@/auth';
import type { StudentRecord } from '@/persistence/records';
import styles from './Landing.module.css';

const AVATAR_COLORS = [
  '#8B7355', '#6B8F71', '#5B6B8A', '#C49A3C',
  '#B8564F', '#7B6B8A', '#5A8B7B', '#8B6B55',
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] ?? '#8B7355';
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

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
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load existing students
  useEffect(() => {
    getAllStudents().then((s) => {
      setStudents(s);
      setLoading(false);
    });
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
      if (match) {
        setStudent(match);
      } else {
        const student = await createStudent({
          name: userName,
          displayName: userName,
        });
        notify(Store.Students);
        setStudent(student);
      }
    });
  }, [isAuthenticated, user, setStudent]);

  const handleSelect = useCallback((student: StudentRecord) => {
    setStudent(student);
  }, [setStudent]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    const student = await createStudent({ name: name.trim() });
    notify(Store.Students);
    setName('');
    setShowForm(false);
    setStudent(student);
  }, [name, setStudent]);

  if (loading) return null;

  return (
    <div className={styles.landing}>
      <h1 className={styles.title}>ember</h1>
      <p className={styles.subtitle}>
        a quiet room with a good mind in it
      </p>

      {/* OAuth sign-in (when Supabase is configured) */}
      {isConfigured && !isAuthenticated && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Sign in</div>
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

      {/* Local student selection (always available) */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          {students.length > 0 ? 'Continue' : 'Begin'}
        </div>

        <div className={styles.studentList}>
          {students.map((s) => (
            <button
              key={s.id}
              className={styles.studentCard}
              onClick={() => handleSelect(s)}
            >
              <div
                className={styles.avatar}
                style={{ background: avatarColor(s.avatarSeed) }}
              >
                {initials(s.displayName)}
              </div>
              <div className={styles.studentInfo}>
                <div className={styles.studentName}>{s.displayName}</div>
                <div className={styles.studentMeta}>
                  {s.totalMinutes > 0
                    ? `${Math.round(s.totalMinutes / 60)} hours`
                    : 'just beginning'}
                </div>
              </div>
            </button>
          ))}

          {!showForm ? (
            <button
              className={styles.newStudentButton}
              onClick={() => setShowForm(true)}
            >
              open a new notebook
            </button>
          ) : (
            <div className={styles.form}>
              <input
                className={styles.input}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className={styles.formActions}>
                <button
                  className={styles.formButton}
                  onClick={() => { setShowForm(false); setName(''); }}
                >
                  cancel
                </button>
                <button
                  className={styles.formButtonPrimary}
                  onClick={handleCreate}
                  disabled={!name.trim()}
                >
                  begin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.epigraph}>
        <p className={styles.quote}>
          What if every child had a tutor who followed their curiosity,
          knew them deeply, and never moved on until understanding was real?
        </p>
        <p className={styles.attribution}>
          The question Ember exists to answer
        </p>
      </div>
    </div>
  );
}
