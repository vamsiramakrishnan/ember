/**
 * LandingStudentList — local student selection and creation form.
 * Renders existing student cards and the "open a new notebook" flow.
 * See: Landing surface, local identity selection.
 */
import { useState, useCallback } from 'react';
import { Store, notify } from '@/persistence';
import { createStudent } from '@/persistence/repositories/students';
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
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#8B7355';
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

interface Props {
  students: StudentRecord[];
  onSelect: (student: StudentRecord) => void;
}

export function LandingStudentList({ students, onSelect }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    const student = await createStudent({ name: name.trim() });
    notify(Store.Students);
    setName('');
    setShowForm(false);
    onSelect(student);
  }, [name, onSelect]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>
        {students.length > 0 ? 'Continue' : 'Begin'}
      </div>
      <div className={styles.studentList}>
        {students.map((s) => (
          <button key={s.id} className={styles.studentCard} onClick={() => onSelect(s)}>
            <div className={styles.avatar} style={{ background: avatarColor(s.avatarSeed) }}>
              {initials(s.displayName)}
            </div>
            <div className={styles.studentInfo}>
              <div className={styles.studentName}>{s.displayName}</div>
              <div className={styles.studentMeta}>
                {s.totalMinutes > 0 ? `${Math.round(s.totalMinutes / 60)} hours` : 'just beginning'}
              </div>
            </div>
          </button>
        ))}
        {!showForm ? (
          <button className={styles.newStudentButton} onClick={() => setShowForm(true)}>
            open a new notebook
          </button>
        ) : (
          <div className={styles.form}>
            <input
              className={styles.input} type="text" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className={styles.formActions}>
              <button className={styles.formButton} onClick={() => { setShowForm(false); setName(''); }}>
                cancel
              </button>
              <button className={styles.formButtonPrimary} onClick={handleCreate} disabled={!name.trim()}>
                begin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
