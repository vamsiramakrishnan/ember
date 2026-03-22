/**
 * Notebook — Surface 1: The Desk
 * The active session. The student writes, the tutor annotates.
 * Now persistence-backed — entries survive refresh, sessions accumulate.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { SessionDivider } from '@/components/peripheral/SessionDivider';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { BlockInserter } from '@/components/student/BlockInserter';
import { InputZone } from '@/components/student/InputZone';
import { MentionPopup } from '@/components/student/MentionPopup';
import { SlashCommandPopup } from '@/components/student/SlashCommandPopup';
import { usePersistedNotebook } from '@/hooks/usePersistedNotebook';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useTutorResponse } from '@/hooks/useTutorResponse';
import { useSketchAnalysis } from '@/hooks/useSketchAnalysis';
import { useMasteryUpdater } from '@/hooks/useMasteryUpdater';
import { useConstellationSync } from '@/hooks/useConstellationSync';
import { useSessionIndexer } from '@/hooks/useSessionIndexer';
import { useContentDrop } from '@/hooks/useContentDrop';
import { useEntryReorder } from '@/hooks/useEntryReorder';
import { usePopupState } from '@/hooks/usePopupState';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { branchNotebook } from '@/services/notebook-branch';
import { useStudent } from '@/contexts/StudentContext';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import type { StudentEntryType, NotebookEntry } from '@/types/entries';
import type { Surface } from '@/layout/Navigation';
import styles from './Notebook.module.css';

type NotebookMode = 'linear' | 'canvas';

interface NotebookProps {
  onNavigate?: (surface: Surface) => void;
}

export function Notebook({ onNavigate }: NotebookProps) {
  const { student, notebook, setNotebook } = useStudent();
  const { current, past, startNewSession, loading: sessionsLoading } = useSessionManager();

  // Auto-create Session 1 when a notebook has no sessions
  useEffect(() => {
    if (!sessionsLoading && !current && past.length === 0) {
      void startNewSession('');
    }
  }, [sessionsLoading, current, past.length, startNewSession]);

  const sessionId = current?.id ?? null;

  const {
    entries, addEntry, addEntryWithId, patchEntryContent, crossOut,
    toggleBookmark, togglePin, annotate, pinnedEntries,
  } = usePersistedNotebook(sessionId);

  const addEntries = useCallback((_e: unknown[]) => {}, []);
  const { respond } = useTutorResponse(
    addEntry, addEntries, entries, addEntryWithId, patchEntryContent,
  );
  const { analyseSketch } = useSketchAnalysis(addEntry);
  const { checkAndUpdate } = useMasteryUpdater();
  useConstellationSync(entries);
  useSessionIndexer(past);
  const contentDrop = useContentDrop({ addEntry });
  const reorder = useEntryReorder();
  const popup = usePopupState(onNavigate);
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Derive marginal reference from tutor connections or echoes
  const marginalRef = useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i]?.entry;
      if (!e) continue;
      if (e.type === 'tutor-connection') return e.content.slice(0, 120) + (e.content.length > 120 ? '…' : '');
      if (e.type === 'echo') return e.content;
    }
    return null;
  }, [entries]);

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

  const handleBranch = useCallback(async (_entryId: string, content: string) => {
    if (!student || !notebook) return;
    const preview = content.slice(0, 80) + (content.length > 80 ? '…' : '');
    // Confirmation dialog — branching is a commitment
    const confirmed = window.confirm(
      `Branch into a new notebook?\n\n"${preview}"\n\nThis creates a new exploration that inherits your current thinkers, vocabulary, and mastery.`,
    );
    if (!confirmed) return;

    const title = content.slice(0, 60) + (content.length > 60 ? '…' : '');
    const result = await branchNotebook({
      studentId: student.id,
      parentNotebookId: notebook.id,
      branchTitle: title,
      branchQuestion: content.slice(0, 200),
      seedContent: content,
    });
    setNotebook(result.notebook);
  }, [student, notebook, setNotebook]);

  /** Handle selection toolbar actions: link, annotate, highlight, ask. */
  const handleSelectionAction = useCallback((entryId: string, actionType: string, selectedText: string) => {
    switch (actionType) {
      case 'link':
        // Trigger mention popup with the selected text as query
        popup.handleMentionTrigger(selectedText.slice(0, 20));
        break;
      case 'annotate':
        // Create a span-targeted annotation on this entry
        void annotate(entryId, `Note on: "${selectedText}"`);
        break;
      case 'highlight': {
        // Create an insight annotation marking this span
        void annotate(entryId, `"${selectedText}"`);
        break;
      }
      case 'ask':
        // Submit the selected text as a question to the tutor
        submitEntry({ type: 'question', content: selectedText });
        break;
    }
  }, [annotate, submitEntry, popup]);

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
            {marginalRef && (
              <MarginZone>
                <MarginalReference>{marginalRef}</MarginalReference>
              </MarginZone>
            )}
            {entries.map((le, i) => (
              <div key={le.id} className={styles.entryRow}>
                <NotebookEntryWrapper
                  liveEntry={le}
                  onCrossOut={crossOut}
                  onToggleBookmark={toggleBookmark}
                  onTogglePin={togglePin}
                  onAnnotate={annotate}
                  onSelectionAction={handleSelectionAction}
                  onBranch={handleBranch}
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
          <div style={{ position: 'relative' }}>
            {popup.mentionQuery !== null && (
              <MentionPopup
                query={popup.mentionQuery}
                results={popup.mentionResults}
                onSelect={(e) => popup.handleMentionSelect(e)}
                onClose={popup.handlePopupClose}
              />
            )}
            {popup.slashQuery !== null && (
              <SlashCommandPopup
                query={popup.slashQuery}
                onSelect={(c) => popup.handleSlashSelect(c)}
                onClose={popup.handlePopupClose}
              />
            )}
            <InputZone
              onSubmit={handleSubmit}
              onSubmitTyped={handleSubmitTyped}
              onSketchSubmit={handleSketchSubmit}
              onMentionTrigger={popup.handleMentionTrigger}
              onSlashTrigger={popup.handleSlashTrigger}
              onPopupClose={popup.handlePopupClose}
              onPaste={contentDrop.handlePaste}
              insertText={popup.pendingInsert}
              onInsertConsumed={popup.handleInsertConsumed}
            />
          </div>
          <div ref={bottomRef} />
        </>
      ) : (
        <NotebookCanvas sessionId={sessionId} entries={entries} />
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
