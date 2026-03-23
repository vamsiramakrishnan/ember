/**
 * NotebookPastSession — renders a single completed session in the
 * notebook scroll, with dimmed opacity to distinguish from the active session.
 * See: 04-information-architecture.md, session accumulation.
 */
import { usePersistedNotebook } from '@/hooks/usePersistedNotebook';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';

interface PastSessionProps {
  session: {
    id: string;
    number: number;
    date: string;
    timeOfDay: string;
    topic: string;
  };
}

export function NotebookPastSession({ session }: PastSessionProps) {
  const { entries } = usePersistedNotebook(session.id);

  return (
    <>
      <SessionHeader
        sessionNumber={session.number}
        date={session.date}
        timeOfDay={session.timeOfDay}
        topic={session.topic}
      />
      <div style={{ opacity: 0.55 }}>
        {entries.map((le) => (
          <NotebookEntryRenderer key={le.id} entry={le.entry} />
        ))}
      </div>
    </>
  );
}
