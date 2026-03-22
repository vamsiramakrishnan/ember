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
import { BlockInserter } from '@/components/student/BlockInserter';
import { InputZone } from '@/components/student/InputZone';
import { usePersistedNotebook } from '@/hooks/usePersistedNotebook';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useTutorResponse } from '@/hooks/useTutorResponse';
import { useSketchAnalysis } from '@/hooks/useSketchAnalysis';
import { useMasteryUpdater } from '@/hooks/useMasteryUpdater';
import { useConstellationSync } from '@/hooks/useConstellationSync';
import { useSessionIndexer } from '@/hooks/useSessionIndexer';
import { useContentDrop } from '@/hooks/useContentDrop';
import { useEntryReorder } from '@/hooks/useEntryReorder';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import type { StudentEntryType, NotebookEntry } from '@/types/entries';
import styles from './Notebook.module.css';

type NotebookMode = 'linear' | 'canvas';

export function Notebook() {
  const { current, past } = useSessionManager();
  const sessionId = current?.id ?? null;

  const {
    entries, addEntry, crossOut,
    toggleBookmark, togglePin, annotate, pinnedEntries,
  } = usePersistedNotebook(sessionId);

  const addEntries = useCallback((_e: unknown[]) => {}, []);
  const { respond } = useTutorResponse(addEntry, addEntries, entries);
  const { analyseSketch } = useSketchAnalysis(addEntry);
  const { checkAndUpdate } = useMasteryUpdater();
  useConstellationSync(entries);
  useSessionIndexer(past);
  const contentDrop = useContentDrop({ addEntry });
  const reorder = useEntryReorder();
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const submitEntry = useCallback((entry: NotebookEntry) => {
    void addEntry(entry);
    setTimeout(scrollToBottom, 50);
    respond(entry);
    void checkAndUpdate(entries);
  }, [addEntry, respond, scrollToBottom, checkAndUpdate, entries]);

  const handleSubmit = useCallback((text: string) => {
    submitEntry(createStudentEntry(text));
  }, [submitEntry]);

  const handleSubmitTyped = useCallback((text: string, type: StudentEntryType) => {
    submitEntry({ type, content: text });
  }, [submitEntry]);

  const handleInlineInsert = useCallback((_type: StudentEntryType) => {
    // Scroll to the InputZone — the type will be set there
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleInlinePaste = useCallback((text: string, type: StudentEntryType) => {
    submitEntry({ type, content: text });
  }, [submitEntry]);

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
          <div
            className={styles.entryContainer}
            onDrop={contentDrop.handleDrop}
            onDragOver={contentDrop.handleDragOver}
          >
            <MarginZone>
              <MarginalReference>
                Pythagoras also believed in the music of the spheres —
                but he arrived at it through pure number theory, not observation.
              </MarginalReference>
            </MarginZone>
            {entries.map((le, i) => (
              <div key={le.id} className={styles.entryRow}>
                <NotebookEntryWrapper
                  liveEntry={le}
                  onCrossOut={crossOut}
                  onToggleBookmark={toggleBookmark}
                  onTogglePin={togglePin}
                  onAnnotate={annotate}
                  onDragStart={reorder.onDragStart}
                  onDragOver={reorder.onDragOver}
                  onDragLeave={reorder.onDragLeave}
                  onDrop={reorder.onDrop}
                  onDragEnd={reorder.onDragEnd}
                  isDragOver={reorder.overId === le.id}
                  isDragging={reorder.dragId === le.id}
                />
                {/* Inserter between entries — appears on hover */}
                {i < entries.length - 1 && (
                  <div className={styles.inserterRow}>
                    <BlockInserter
                      onSelect={handleInlineInsert}
                      onPaste={handleInlinePaste}
                      onFileUpload={contentDrop.processFile}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <InputZone
            onSubmit={handleSubmit}
            onSubmitTyped={handleSubmitTyped}
            onSketchSubmit={handleSketchSubmit}
          />
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
