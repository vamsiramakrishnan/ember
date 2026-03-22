/**
 * useSessionManager — manages session lifecycle.
 * Creates new sessions, switches between them, tracks current session.
 * Bridges persistence layer to the Notebook surface.
 */
import { useCallback } from 'react';
import { Store, notify } from '@/persistence';
import { createSession } from '@/persistence/repositories/sessions';
import { usePersistedSessions } from './usePersistedSession';
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
  const { sessions, current, past, loading } = usePersistedSessions();

  const startNewSession = useCallback(async (
    topic?: string,
  ): Promise<SessionRecord> => {
    const nextNumber = (current?.number ?? 0) + 1;
    const session = await createSession({
      number: nextNumber,
      date: formatDate(),
      timeOfDay: getTimeOfDay(),
      topic: topic ?? '',
    });
    notify(Store.Sessions);
    return session;
  }, [current]);

  return {
    sessions,
    current,
    past,
    loading,
    startNewSession,
  };
}
