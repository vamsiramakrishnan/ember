/**
 * Notebook — Surface 1: The Desk
 * The active session. Today's thinking.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { InputZone } from '@/components/student/InputZone';
import { useSessionEntries } from '@/hooks/useSessionEntries';
import { useRevealSequence } from '@/hooks/useRevealSequence';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import styles from './Notebook.module.css';

const pinnedThreads = [
  'Is there a mathematical pattern to why some chords sound beautiful?',
  'Why do planets orbit in ellipses instead of circles?',
];

type NotebookMode = 'linear' | 'canvas';

export function Notebook() {
  const { entries, meta } = useSessionEntries();
  const { revealedCount, getEntryStyle } = useRevealSequence(entries.length);
  const [mode, setMode] = useState<NotebookMode>('linear');

  return (
    <Column>
      <SessionHeader
        sessionNumber={meta.sessionNumber}
        date={meta.date}
        timeOfDay={meta.timeOfDay}
        topic={meta.topic}
      />
      <div className={styles.modeToggle}>
        <button
          className={mode === 'linear' ? styles.modeActive : styles.modeButton}
          onClick={() => setMode('linear')}
          aria-current={mode === 'linear' ? 'page' : undefined}
        >
          Linear
        </button>
        <button
          className={mode === 'canvas' ? styles.modeActive : styles.modeButton}
          onClick={() => setMode('canvas')}
          aria-current={mode === 'canvas' ? 'page' : undefined}
        >
          Canvas
        </button>
      </div>
      {pinnedThreads.length > 0 && (
        <div className={styles.pinZone} role="complementary" aria-label="Pinned threads">
          {pinnedThreads.map((thread, i) => (
            <PinnedThread key={i}>{thread}</PinnedThread>
          ))}
        </div>
      )}
      {mode === 'linear' ? (
        <>
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
            <InputZone />
          )}
        </>
      ) : (
        <NotebookCanvas />
      )}
    </Column>
  );
}
