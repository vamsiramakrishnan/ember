/**
 * NotebookSelect — the student's desk.
 * Shows their notebooks. They pick one, or start a new exploration.
 * New notebooks are bootstrapped with AI-researched seed data.
 */
import { useState, useEffect, useCallback } from 'react';
import { Store, notify } from '@/persistence';
import {
  getNotebooksByStudent,
  createNotebook,
} from '@/persistence/repositories/notebooks';
import { createSession } from '@/persistence/repositories/sessions';
import { createEntry } from '@/persistence/repositories/entries';
import { bootstrapNotebook } from '@/services/notebook-bootstrap';
import { generateNotebookIcon } from '@/services/notebook-enrichment';
import { useStudent } from '@/contexts/StudentContext';
import type { NotebookRecord } from '@/persistence/records';
import { NotebookList } from './NotebookList';
import styles from './NotebookSelect.module.css';

type Phase = 'list' | 'creating' | 'bootstrapping';

export function NotebookSelect() {
  const { student, setNotebook } = useStudent();
  const [notebooks, setNotebooks] = useState<NotebookRecord[]>([]);
  const [phase, setPhase] = useState<Phase>('list');
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [bootstrapStatus, setBootstrapStatus] = useState('');

  useEffect(() => {
    if (!student) return;
    getNotebooksByStudent(student.id).then(setNotebooks);
  }, [student]);

  const handleSelect = useCallback((nb: NotebookRecord) => {
    setNotebook(nb);
  }, [setNotebook]);

  const handleCreate = useCallback(async () => {
    if (!student || !title.trim()) return;

    setPhase('bootstrapping');
    setBootstrapStatus('Creating notebook');

    const nb = await createNotebook({
      studentId: student.id,
      title: title.trim(),
      description: question.trim(),
    });
    notify(Store.Notebooks);

    const session = await createSession({
      studentId: student.id,
      notebookId: nb.id,
      number: 1,
      date: new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      }),
      timeOfDay: getTimeOfDay(),
      topic: title.trim(),
    });
    notify(Store.Sessions);

    setBootstrapStatus('Researching your topic');

    const [result] = await Promise.all([
      bootstrapNotebook(student.id, nb.id, title.trim(), question.trim()),
      generateNotebookIcon(nb.id, title.trim(), question.trim())
        .catch(() => null),
    ]);

    if (result.opening) {
      await createEntry(session.id, {
        type: 'tutor-marginalia',
        content: result.opening,
      });
      notify(Store.Entries);
    }

    setTitle('');
    setQuestion('');
    setPhase('list');
    setNotebook(nb);
  }, [student, title, question, setNotebook]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && title.trim()) {
        e.preventDefault();
        void handleCreate();
      }
    },
    [handleCreate, title],
  );

  if (!student) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.greeting}>
        Welcome back, {student.displayName}
      </h2>
      {phase === 'bootstrapping' ? (
        <div className={styles.bootstrap}>
          <div className={styles.bootstrapDot} />
          <span className={styles.bootstrapLabel}>{bootstrapStatus}</span>
        </div>
      ) : (
        <NotebookList
          notebooks={notebooks}
          showForm={phase === 'creating'}
          title={title}
          question={question}
          onSelect={handleSelect}
          onShowForm={() => setPhase('creating')}
          onHideForm={() => { setPhase('list'); setTitle(''); setQuestion(''); }}
          onTitleChange={setTitle}
          onQuestionChange={setQuestion}
          onKeyDown={handleKeyDown}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
