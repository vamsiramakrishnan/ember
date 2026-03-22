/**
 * Notebook — Surface 1: The Desk
 * The active session. The student writes, the tutor annotates.
 * Now persistence-backed — entries survive refresh, sessions accumulate.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState, useRef, useCallback } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { SessionDivider } from '@/components/peripheral/SessionDivider';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { InputZone } from '@/components/student/InputZone';
import { usePersistedNotebook } from '@/hooks/usePersistedNotebook';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useTutorResponse } from '@/hooks/useTutorResponse';
import { useSketchAnalysis } from '@/hooks/useSketchAnalysis';
import { useMasteryUpdater } from '@/hooks/useMasteryUpdater';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import styles from './Notebook.module.css';

type NotebookMode = 'linear' | 'canvas';

export function Notebook() {
  const { current, past } = useSessionManager();
  const sessionId = current?.id ?? null;

  const {
    entries, addEntry, crossOut,
    toggleBookmark, togglePin, pinnedEntries,
  } = usePersistedNotebook(sessionId);

  const addEntries = useCallback((_e: unknown[]) => {}, []);
  const { respond } = useTutorResponse(addEntry, addEntries, entries);
  const { analyseSketch } = useSketchAnalysis(addEntry);
  const { checkAndUpdate } = useMasteryUpdater();
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleSubmit = useCallback((text: string) => {
    const studentEntry = createStudentEntry(text);
    void addEntry(studentEntry);
    setTimeout(scrollToBottom, 50);
    respond(studentEntry);
    void checkAndUpdate(entries);
  }, [addEntry, respond, scrollToBottom, checkAndUpdate, entries]);

  const handleSketchSubmit = useCallback((dataUrl: string) => {
    void addEntry({ type: 'sketch', dataUrl });
    setTimeout(scrollToBottom, 50);
    void analyseSketch(dataUrl);
  }, [addEntry, scrollToBottom, analyseSketch]);

  return (
    <Column>
      {past.map((session) => (
        <PastSession key={session.id} session={session} />
      ))}
      {past.length > 0 && <SessionDivider />}
      {current && (
        <SessionHeader
          sessionNumber={current.number}
          date={current.date}
          timeOfDay={current.timeOfDay}
          topic={current.topic}
        />
      )}
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
            {entries.map((le) => (
              <NotebookEntryWrapper
                key={le.id}
                liveEntry={le}
                onCrossOut={crossOut}
                onToggleBookmark={toggleBookmark}
                onTogglePin={togglePin}
              />
            ))}
          </div>
          <InputZone onSubmit={handleSubmit} onSketchSubmit={handleSketchSubmit} />
          <div ref={bottomRef} />
        </>
      ) : (
        <NotebookCanvas />
      )}
    </Column>
  );
}

function PastSession({ session }: {
  session: { id: string; number: number; date: string; timeOfDay: string; topic: string };
}) {
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
