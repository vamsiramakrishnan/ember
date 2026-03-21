/**
 * Notebook — Surface 1: The Desk
 * The active session. The student writes, the tutor annotates.
 * Entries are live — student can write, cross out, pin, bookmark.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { SessionDivider } from '@/components/peripheral/SessionDivider';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { InputZone } from '@/components/student/InputZone';
import { useNotebookEntries } from '@/hooks/useNotebookEntries';
import { useRevealSequence } from '@/hooks/useRevealSequence';
import { useTutorResponse } from '@/hooks/useTutorResponse';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { demoSession, demoSessionMeta } from '@/data/demo-session';
import { demoPastSession, demoPastSessionMeta } from '@/data/demo-past-session';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import styles from './Notebook.module.css';

type NotebookMode = 'linear' | 'canvas';

export function Notebook() {
  const {
    entries, addEntry, addEntries, crossOut,
    toggleBookmark, togglePin, pinnedEntries,
  } = useNotebookEntries(demoSession);
  const { revealedCount, getEntryStyle } = useRevealSequence(demoSession.length);
  const { respond } = useTutorResponse(addEntry, addEntries);
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [demoRevealed, setDemoRevealed] = useState(false);

  useEffect(() => {
    if (revealedCount >= demoSession.length) setDemoRevealed(true);
  }, [revealedCount]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleSubmit = useCallback((text: string) => {
    const studentEntry = createStudentEntry(text);
    addEntry(studentEntry);
    setTimeout(scrollToBottom, 50);
    respond(studentEntry);
  }, [addEntry, respond, scrollToBottom]);

  const handleSketchSubmit = useCallback((dataUrl: string) => {
    addEntry({ type: 'sketch', dataUrl });
    setTimeout(scrollToBottom, 50);
  }, [addEntry, scrollToBottom]);

  return (
    <Column>
      <PastSession />
      <SessionDivider />
      <SessionHeader
        sessionNumber={demoSessionMeta.sessionNumber}
        date={demoSessionMeta.date}
        timeOfDay={demoSessionMeta.timeOfDay}
        topic={demoSessionMeta.topic}
      />
      <ModeToggle mode={mode} setMode={setMode} />
      {pinnedEntries.length > 0 && (
        <div className={styles.pinZone} role="complementary" aria-label="Pinned threads">
          {pinnedEntries.map((pe) => (
            <PinnedThread key={pe.id}>
              {'content' in pe.entry ? pe.entry.content : ''}
            </PinnedThread>
          ))}
        </div>
      )}
      {mode === 'linear' ? (
        <>
          <div className={styles.entryContainer}>
            <MarginZone>
              <MarginalReference>
                Pythagoras also believed in the music of the spheres —
                but he arrived at it through pure number theory, not observation.
              </MarginalReference>
            </MarginZone>
            {entries.map((le, i) => (
              <NotebookEntryWrapper
                key={le.id}
                liveEntry={le}
                onCrossOut={crossOut}
                onToggleBookmark={toggleBookmark}
                onTogglePin={togglePin}
                style={i < demoSession.length ? getEntryStyle(i) : undefined}
              />
            ))}
          </div>
          {demoRevealed && (
            <InputZone onSubmit={handleSubmit} onSketchSubmit={handleSketchSubmit} />
          )}
          <div ref={bottomRef} />
        </>
      ) : (
        <NotebookCanvas />
      )}
    </Column>
  );
}

function PastSession() {
  return (
    <>
      <SessionHeader
        sessionNumber={demoPastSessionMeta.sessionNumber}
        date={demoPastSessionMeta.date}
        timeOfDay={demoPastSessionMeta.timeOfDay}
        topic={demoPastSessionMeta.topic}
      />
      <div style={{ opacity: 0.55 }}>
        {demoPastSession.map((entry, i) => (
          <NotebookEntryRenderer key={`past-${i}`} entry={entry} />
        ))}
      </div>
    </>
  );
}

function ModeToggle({ mode, setMode }: {
  mode: NotebookMode;
  setMode: (m: NotebookMode) => void;
}) {
  return (
    <div className={styles.modeToggle}>
      <button
        className={mode === 'linear' ? styles.modeActive : styles.modeButton}
        onClick={() => setMode('linear')}
        aria-current={mode === 'linear' ? 'page' : undefined}
      >Linear</button>
      <button
        className={mode === 'canvas' ? styles.modeActive : styles.modeButton}
        onClick={() => setMode('canvas')}
        aria-current={mode === 'canvas' ? 'page' : undefined}
      >Canvas</button>
    </div>
  );
}
