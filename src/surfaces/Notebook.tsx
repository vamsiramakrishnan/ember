/**
 * Notebook — Surface 1: The Desk
 * The active session. The student writes, the tutor annotates.
 * Now persistence-backed — entries survive refresh, sessions accumulate.
 *
 * State management: all entry actions are centralised through
 * NotebookContext, eliminating the 20+ prop chain to EntryWrapper.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { SessionDivider } from '@/components/peripheral/SessionDivider';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { InputZone } from '@/components/student/InputZone';
import { TutorActivity } from '@/components/peripheral/TutorActivity';
import { MentionPopup } from '@/components/student/MentionPopup';
import { SlashCommandPopup } from '@/components/student/SlashCommandPopup';
import { NotebookProvider } from '@/contexts/NotebookContext';
import { usePersistedNotebook } from '@/hooks/usePersistedNotebook';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useTutorResponse } from '@/hooks/useTutorResponse';
import { useSketchAnalysis } from '@/hooks/useSketchAnalysis';
import { useMasteryUpdater } from '@/hooks/useMasteryUpdater';
import { useConstellationSync } from '@/hooks/useConstellationSync';
import { useSessionIndexer } from '@/hooks/useSessionIndexer';
import { useContentDrop } from '@/hooks/useContentDrop';
import { useEntryReorder } from '@/hooks/useEntryReorder';
import { useInPlaceEdit } from '@/hooks/useInPlaceEdit';
import { usePopupState } from '@/hooks/usePopupState';
import { useSlashCommandRouter } from '@/hooks/useSlashCommandRouter';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { branchNotebook } from '@/services/notebook-branch';
import { useStudent } from '@/contexts/StudentContext';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { NotebookCanvas } from './NotebookCanvas';
import { recordStudentTurn, setStudentFocus, addRelation } from '@/state';
import type { NotebookEntry } from '@/types/entries';
import type { Surface } from '@/layout/Navigation';
import styles from './Notebook.module.css';

type NotebookMode = 'linear' | 'canvas';

interface NotebookProps {
  onNavigate?: (surface: Surface) => void;
}

export function Notebook({ onNavigate }: NotebookProps) {
  const { student, notebook, setNotebook } = useStudent();
  const { current, past, startNewSession, loading: sessionsLoading } = useSessionManager();

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

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const addEntries = useCallback((_e: unknown[]) => {}, []);
  const { respond, isThinking } = useTutorResponse(
    addEntry, addEntries, entries, addEntryWithId, patchEntryContent,
  );
  const { analyseSketch } = useSketchAnalysis(addEntry);
  const { checkAndUpdate } = useMasteryUpdater();
  useConstellationSync(entries);
  useSessionIndexer(past);
  const contentDrop = useContentDrop({ addEntry });
  const reorder = useEntryReorder();
  const inPlaceEdit = useInPlaceEdit();
  const popup = usePopupState(onNavigate);
  const slashRouter = useSlashCommandRouter({
    addEntry, respond, entries,
    studentId: student?.id, notebookId: notebook?.id,
  });
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);

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
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  const prevEntryCount = useRef(entries.length);
  useEffect(() => {
    if (entries.length > prevEntryCount.current) scrollToBottom();
    prevEntryCount.current = entries.length;
  }, [entries.length, scrollToBottom]);

  // ─── Unified entry submission ─────────────────────────────────────

  const submitEntry = useCallback((entry: NotebookEntry) => {
    void addEntry(entry);
    recordStudentTurn(entry.type);
    setStudentFocus({ type: 'writing' });
    respond(entry);
    void checkAndUpdate(entriesRef.current);
  }, [addEntry, respond, checkAndUpdate]);

  const handleSubmit = useCallback((text: string) => {
    // Check if a slash command was just selected — route to agent only.
    // Don't call submitEntry (which triggers the orchestrator/tutor),
    // otherwise both the slash router AND the orchestrator fire.
    const cmd = popup.consumeSlashCommand();
    if (cmd && text.includes(`/${cmd.label}`)) {
      void addEntry({ type: 'prose', content: text });
      recordStudentTurn('prose');
      void slashRouter.route(cmd, text);
      return;
    }
    submitEntry(createStudentEntry(text));
  }, [submitEntry, addEntry, popup, slashRouter]);

  const handleSubmitTyped = useCallback((text: string, type: string) => {
    submitEntry({ type: type as 'prose', content: text });
  }, [submitEntry]);

  // ─── Action handlers for NotebookContext ──────────────────────────

  const handleBranch = useCallback(async (_id: string, content: string) => {
    if (!student || !notebook) return;
    const preview = content.slice(0, 80) + (content.length > 80 ? '…' : '');
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

  const handleSelectionAction = useCallback((entryId: string, actionType: string, selectedText: string) => {
    switch (actionType) {
      case 'link':
        popup.handleMentionTrigger(selectedText.slice(0, 20));
        break;
      case 'annotate':
        void annotate(entryId, `Note on: "${selectedText}"`);
        break;
      case 'highlight':
        void annotate(entryId, `"${selectedText}"`);
        break;
      case 'ask':
        submitEntry({ type: 'question', content: selectedText });
        break;
    }
  }, [annotate, submitEntry, popup]);

  const handleFollowUp = useCallback((question: string, tutorContext: string) => {
    const contextHint = tutorContext.length > 100 ? tutorContext.slice(0, 100) + '…' : tutorContext;
    const fullQuestion = `Regarding your note "${contextHint}" — ${question}`;
    const tutorEntry = entries.find((le) => 'content' in le.entry && le.entry.content === tutorContext);
    submitEntry({ type: 'question', content: fullQuestion });
    if (tutorEntry) {
      const questionId = entries[entries.length - 1]?.id;
      if (questionId) {
        addRelation({ from: questionId, to: tutorEntry.id, type: 'follow-up', meta: question.slice(0, 80) });
      }
    }
  }, [submitEntry, entries]);

  const handleSketchSubmit = useCallback((dataUrl: string) => {
    void addEntry({ type: 'sketch', dataUrl });
    void analyseSketch(dataUrl);
  }, [addEntry, analyseSketch]);

  // ─── Drag state for context ───────────────────────────────────────

  const drag = useMemo(() => ({
    dragId: reorder.dragId,
    overId: reorder.overId,
  }), [reorder.dragId, reorder.overId]);

  const dragHandlers = useMemo(() => ({
    onDragStart: reorder.onDragStart,
    onDragOver: reorder.onDragOver,
    onDragLeave: reorder.onDragLeave,
    onDrop: reorder.onDrop,
    onDragEnd: reorder.onDragEnd,
  }), [reorder.onDragStart, reorder.onDragOver, reorder.onDragLeave, reorder.onDrop, reorder.onDragEnd]);

  return (
    <NotebookProvider
      crossOut={crossOut}
      toggleBookmark={toggleBookmark}
      togglePin={togglePin}
      annotate={annotate}
      onBranch={handleBranch}
      onFollowUp={handleFollowUp}
      onSelectionAction={handleSelectionAction}
      startEdit={inPlaceEdit.startEdit}
      saveEdit={inPlaceEdit.saveEdit}
      cancelEdit={inPlaceEdit.cancelEdit}
      editingId={inPlaceEdit.editingId}
      drag={drag}
      dragHandlers={dragHandlers}
      editPopup={{
        onMentionTrigger: popup.handleMentionTrigger,
        onSlashTrigger: popup.handleSlashTrigger,
        onPopupClose: popup.handlePopupClose,
        pendingInsert: popup.pendingInsert,
        onInsertConsumed: popup.handleInsertConsumed,
      }}
    >
      <NotebookContent
        entries={entries}
        pinnedEntries={pinnedEntries}
        past={past}
        current={current}
        sessionId={sessionId}
        mode={mode}
        setMode={setMode}
        marginalRef={marginalRef}
        contentDrop={contentDrop}
        popup={popup}
        isThinking={isThinking}
        bottomRef={bottomRef}
        handleSubmit={handleSubmit}
        handleSubmitTyped={handleSubmitTyped}
        handleSketchSubmit={handleSketchSubmit}
      />
    </NotebookProvider>
  );
}

// ─── Inner content (kept separate for 150-line discipline) ─────────

interface ContentProps {
  entries: import('@/types/entries').LiveEntry[];
  pinnedEntries: import('@/types/entries').LiveEntry[];
  past: import('@/persistence/records').SessionRecord[];
  current: import('@/persistence/records').SessionRecord | null;
  sessionId: string | null;
  mode: NotebookMode;
  setMode: (m: NotebookMode) => void;
  marginalRef: string | null;
  contentDrop: ReturnType<typeof useContentDrop>;
  popup: ReturnType<typeof usePopupState>;
  isThinking: boolean;
  bottomRef: React.RefObject<HTMLDivElement>;
  handleSubmit: (text: string) => void;
  handleSubmitTyped: (text: string, type: string) => void;
  handleSketchSubmit: (dataUrl: string) => void;
}

function NotebookContent({
  entries, pinnedEntries, past, current, sessionId, mode, setMode,
  marginalRef, contentDrop, popup, isThinking, bottomRef,
  handleSubmit, handleSubmitTyped, handleSketchSubmit,
}: ContentProps) {
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
            aria-live="polite"
            aria-relevant="additions"
          >
            {marginalRef && (
              <MarginZone>
                <MarginalReference>{marginalRef}</MarginalReference>
              </MarginZone>
            )}
            {entries.map((le) => (
              <div key={le.id} className={styles.entryRow}>
                <NotebookEntryWrapper liveEntry={le} />
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
            <TutorActivity />
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
              disabled={isThinking}
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
