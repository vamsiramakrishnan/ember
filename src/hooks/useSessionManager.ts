/**
 * useSessionManager — manages session lifecycle within a notebook.
 * Creates new sessions, tracks current/past sessions.
 * Scoped to the current student and notebook from context.
 */
import { useCallback } from 'react';
import { Store, notify, useStoreQuery } from '@/persistence';
import { createSession, getSessionsByNotebook } from '@/persistence/repositories/sessions';
import { useStudent } from '@/contexts/StudentContext';
import type { SessionRecord } from '@/persistence/records';

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function useSessionManager() {
  const { student, notebook } = useStudent();
  const notebookId = notebook?.id ?? null;
  const studentId = student?.id ?? null;

  const { data: sessions, loading } = useStoreQuery<SessionRecord[]>(
    Store.Sessions,
    async () => {
      if (!notebookId) return [];
      return getSessionsByNotebook(notebookId);
    },
    [],
    [notebookId],
  );

  const current = sessions.length > 0
    ? sessions[sessions.length - 1] ?? null
    : null;

  const past = sessions.length > 1
    ? sessions.slice(0, -1)
    : [];

  const startNewSession = useCallback(async (
    topic?: string,
  ): Promise<SessionRecord | null> => {
    if (!studentId || !notebookId) return null;
    const nextNumber = (current?.number ?? 0) + 1;
    const session = await createSession({
      studentId,
      notebookId,
      number: nextNumber,
      date: formatDate(),
      timeOfDay: getTimeOfDay(),
      topic: topic ?? '',
    });
    notify(Store.Sessions);
    return session;
  }, [studentId, notebookId, current]);

  return {
    sessions,
    current,
    past,
    loading,
    startNewSession,
  };
}
