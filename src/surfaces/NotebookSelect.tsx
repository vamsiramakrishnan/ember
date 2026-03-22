/**
 * NotebookSelect — the student's desk.
 * Shows their notebooks. They pick one, or start a new exploration.
 * Notebooks are named threads of inquiry, not generic containers.
 */
import { useState, useEffect, useCallback } from 'react';
import { Store, notify } from '@/persistence';
import {
  getNotebooksByStudent,
  createNotebook,
} from '@/persistence/repositories/notebooks';
import { useStudent } from '@/contexts/StudentContext';
import type { NotebookRecord } from '@/persistence/records';
import styles from './NotebookSelect.module.css';

export function NotebookSelect() {
  const { student, setNotebook } = useStudent();
  const [notebooks, setNotebooks] = useState<NotebookRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (!student) return;
    getNotebooksByStudent(student.id).then(setNotebooks);
  }, [student]);

  const handleSelect = useCallback((nb: NotebookRecord) => {
    setNotebook(nb);
  }, [setNotebook]);

  const handleCreate = useCallback(async () => {
    if (!student || !title.trim()) return;
    const nb = await createNotebook({
      studentId: student.id,
      title: title.trim(),
      description: desc.trim(),
    });
    notify(Store.Notebooks);
    setTitle('');
    setDesc('');
    setShowForm(false);
    setNotebook(nb);
  }, [student, title, desc, setNotebook]);

  if (!student) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.greeting}>
        Welcome back, {student.displayName}
      </h2>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          {notebooks.length > 0 ? 'Your notebooks' : 'Start exploring'}
        </div>

        <div className={styles.notebookList}>
          {notebooks.map((nb) => (
            <button
              key={nb.id}
              className={styles.notebookCard}
              onClick={() => handleSelect(nb)}
            >
              <div className={styles.notebookTitle}>{nb.title}</div>
              {nb.description && (
                <div className={styles.notebookDesc}>{nb.description}</div>
              )}
              <div className={styles.notebookMeta}>
                {nb.sessionCount} {nb.sessionCount === 1 ? 'session' : 'sessions'}
              </div>
            </button>
          ))}

          {!showForm ? (
            <button
              className={styles.newButton}
              onClick={() => setShowForm(true)}
            >
              begin a new exploration
            </button>
          ) : (
            <div className={styles.form}>
              <input
                className={styles.input}
                type="text"
                placeholder="What do you want to explore?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <input
                className={styles.inputSmall}
                type="text"
                placeholder="A question to guide you (optional)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className={styles.formActions}>
                <button
                  className={styles.formButton}
                  onClick={() => {
                    setShowForm(false);
                    setTitle('');
                    setDesc('');
                  }}
                >
                  cancel
                </button>
                <button
                  className={styles.formButtonPrimary}
                  onClick={handleCreate}
                  disabled={!title.trim()}
                >
                  begin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
