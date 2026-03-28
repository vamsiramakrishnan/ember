/**
 * Notebook — Surface 1: The Desk.
 * See: 04-information-architecture.md, Surface one.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
import { useChipResolver } from '@/hooks/useChipResolver';
import { ChipProvider } from '@/primitives/ChipContext';
import { useInlineExplain } from '@/hooks/useInlineExplain';
import { useDirectiveCompletion } from '@/hooks/useDirectiveCompletion';
import { createStudentEntry } from '@/hooks/useEntryInference';
import { useStudent } from '@/contexts/StudentContext';
import { recordStudentTurn, setStudentFocus } from '@/state';
import type { ResponsePlan } from '@/hooks/useResponseOrchestrator';
import { NotebookContent } from './NotebookContent';
import { handleBranch, handleSelectionAction, handleFollowUp, deriveMarginalRef } from './notebook-handlers';
import type { NotebookMode } from './NotebookModeToggle';
import { trackEvent, traceSurfaceRender } from '@/observability';
import type { NotebookEntry } from '@/types/entries';
import type { Surface } from '@/layout/Navigation';

interface NotebookProps { onNavigate?: (surface: Surface) => void }

export function Notebook({ onNavigate }: NotebookProps) {
  useEffect(() => { const done = traceSurfaceRender('Notebook'); return done; }, []);
  const { student, notebook, setNotebook } = useStudent();
  const { current, past, startNewSession, loading: sessionsLoading } = useSessionManager();

  useEffect(() => {
    if (!sessionsLoading && !current && past.length === 0) void startNewSession('');
  }, [sessionsLoading, current, past.length, startNewSession]);

  const sessionId = current?.id ?? null;
  const {
    entries, addEntry, addEntryWithId, patchEntryContent, crossOut,
    toggleBookmark, togglePin, annotate, pinnedEntries,
  } = usePersistedNotebook(sessionId);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const [responsePlans, setResponsePlans] = useState<ResponsePlan[]>([]);
  const addEntries = useCallback((_e: unknown[]) => {}, []);
  const { respond, isThinking } = useTutorResponse(
    addEntry, addEntries, entries, addEntryWithId, patchEntryContent,
    pinnedEntries, current?.topic ?? null, student?.id, notebook?.id, setResponsePlans,
  );
  const { analyseSketch } = useSketchAnalysis(addEntry);
  const { checkAndUpdate } = useMasteryUpdater();
  useConstellationSync(entries);
  useSessionIndexer(past);
  const contentDrop = useContentDrop({ addEntry });
  const reorder = useEntryReorder();
  const inPlaceEdit = useInPlaceEdit();
  const popup = usePopupState(onNavigate);
  const chipCtx = useChipResolver();

  useEffect(() => {
    if (notebook && entries.length > 0) popup.registerEntries(entries, notebook.id);
  }, [entries, notebook, popup.registerEntries]);

  const slashRouter = useSlashCommandRouter({
    addEntry, addEntryWithId, patchEntryContent, respond,
    entries, studentId: student?.id, notebookId: notebook?.id,
  });
  const { requestInlineExplain } = useInlineExplain({
    entries, notebookId: notebook?.id, addEntry,
  });
  const { completeDirective } = useDirectiveCompletion({ patchEntry: patchEntryContent });
  const [mode, setMode] = useState<NotebookMode>('linear');
  const bottomRef = useRef<HTMLDivElement>(null);
  const marginalRef = useMemo(() => deriveMarginalRef(entries), [entries]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  }, []);
  const prevEntryCount = useRef(entries.length);
  useEffect(() => {
    if (entries.length > prevEntryCount.current) scrollToBottom();
    prevEntryCount.current = entries.length;
  }, [entries.length, scrollToBottom]);

  const submitEntry = useCallback((entry: NotebookEntry) => {
    void addEntry(entry);
    recordStudentTurn(entry.type);
    setStudentFocus({ type: 'writing' });
    trackEvent('entry-submit', { type: entry.type });
    respond(entry);
    void checkAndUpdate(entriesRef.current);
  }, [addEntry, respond, checkAndUpdate]);

  const onSubmit = useCallback((text: string) => {
    const cmd = popup.consumeSlashCommand();
    if (cmd && text.includes(`/${cmd.label}`)) {
      void addEntry({ type: 'prose', content: text });
      recordStudentTurn('prose');
      void slashRouter.route(cmd, text);
      return;
    }
    submitEntry(createStudentEntry(text));
  }, [submitEntry, addEntry, popup, slashRouter]);

  const onSubmitTyped = useCallback((text: string, type: string) => {
    submitEntry({ type: type as 'prose', content: text });
  }, [submitEntry]);

  const onBranch = useCallback(
    (id: string, content: string) => handleBranch({ student, notebook, setNotebook }, id, content),
    [student, notebook, setNotebook],
  );
  const onSelectionAction = useCallback(
    (eId: string, aType: string, sel: string) =>
      handleSelectionAction({ annotate, submitEntry, addEntry, requestInlineExplain, popup }, eId, aType, sel),
    [annotate, submitEntry, addEntry, requestInlineExplain, popup],
  );
  const onFollowUp = useCallback(
    (q: string, ctx: string) => handleFollowUp(submitEntry, entries, q, ctx),
    [submitEntry, entries],
  );
  const onSketchSubmit = useCallback((dataUrl: string) => {
    void addEntry({ type: 'sketch', dataUrl });
    void analyseSketch(dataUrl);
  }, [addEntry, analyseSketch]);

  const drag = useMemo(() => ({ dragId: reorder.dragId, overId: reorder.overId }), [reorder.dragId, reorder.overId]);
  const dragHandlers = useMemo(() => ({
    onDragStart: reorder.onDragStart, onDragOver: reorder.onDragOver,
    onDragLeave: reorder.onDragLeave, onDrop: reorder.onDrop, onDragEnd: reorder.onDragEnd,
  }), [reorder.onDragStart, reorder.onDragOver, reorder.onDragLeave, reorder.onDrop, reorder.onDragEnd]);

  return (
    <ChipProvider value={chipCtx}>
    <NotebookProvider
      crossOut={crossOut} toggleBookmark={toggleBookmark} togglePin={togglePin}
      annotate={annotate} onBranch={onBranch} onFollowUp={onFollowUp}
      onSelectionAction={onSelectionAction}
      onDirectiveComplete={completeDirective}
      patchEntry={patchEntryContent}
      startEdit={inPlaceEdit.startEdit} saveEdit={inPlaceEdit.saveEdit}
      cancelEdit={inPlaceEdit.cancelEdit} editingId={inPlaceEdit.editingId}
      drag={drag} dragHandlers={dragHandlers}
      editPopup={useMemo(() => ({
        onMentionTrigger: popup.handleMentionTrigger, onSlashTrigger: popup.handleSlashTrigger,
        onPopupClose: popup.handlePopupClose, pendingInsert: popup.pendingInsert,
        onInsertConsumed: popup.handleInsertConsumed,
      }), [popup.handleMentionTrigger, popup.handleSlashTrigger, popup.handlePopupClose, popup.pendingInsert, popup.handleInsertConsumed])}
    >
      <NotebookContent
        entries={entries} pinnedEntries={pinnedEntries} past={past} current={current}
        sessionId={sessionId} mode={mode} setMode={setMode} marginalRef={marginalRef}
        contentDrop={contentDrop} popup={popup} isThinking={isThinking}
        responsePlans={responsePlans} bottomRef={bottomRef}
        handleSubmit={onSubmit} handleSubmitTyped={onSubmitTyped} handleSketchSubmit={onSketchSubmit}
      />
    </NotebookProvider>
    </ChipProvider>
  );
}
