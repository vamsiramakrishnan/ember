/**
 * Notebook — Surface 1: The Desk
 * The active session. Today's thinking.
 * See: 04-information-architecture.md, Surface one.
 */
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { useSessionEntries } from '@/hooks/useSessionEntries';
import { useRevealSequence } from '@/hooks/useRevealSequence';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import styles from './Notebook.module.css';

const pinnedThreads = [
  'Is there a mathematical pattern to why some chords sound beautiful?',
  'Why do planets orbit in ellipses instead of circles?',
];

export function Notebook() {
  const { entries, meta } = useSessionEntries();
  const { revealedCount, getEntryStyle } = useRevealSequence(entries.length);

  return (
    <Column>
      <SessionHeader
        sessionNumber={meta.sessionNumber}
        date={meta.date}
        timeOfDay={meta.timeOfDay}
        topic={meta.topic}
      />
      {pinnedThreads.length > 0 && (
        <div className={styles.pinZone} role="complementary" aria-label="Pinned threads">
          {pinnedThreads.map((thread, i) => (
            <PinnedThread key={i}>{thread}</PinnedThread>
          ))}
        </div>
      )}
      <div className={styles.entryContainer}>
        <MarginZone>
          <MarginalReference>
            Pythagoras also believed in the music of the
            spheres — but he arrived at it through pure
            number theory, not observation.
          </MarginalReference>
        </MarginZone>
        {entries.map((entry, i) => (
          <div key={i} style={getEntryStyle(i)}>
            <NotebookEntryRenderer entry={entry} />
          </div>
        ))}
      </div>
      {revealedCount >= entries.length && (
        <div className={styles.inputZone} aria-label="Writing area">
          <div className={styles.inputCursor} aria-hidden="true" />
        </div>
      )}
    </Column>
  );
}
