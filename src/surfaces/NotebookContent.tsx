/** NotebookContent — inner layout for the Notebook surface. See: 04-information-architecture.md */
import { useMemo } from 'react';
import { Column } from '@/primitives/Column';
import { MarginZone } from '@/primitives/MarginZone';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { SessionDivider } from '@/components/peripheral/SessionDivider';
import { PinnedThread } from '@/components/student/PinnedThread';
import { MarginalReference } from '@/components/ambient/MarginalReference';
import { InputZone } from '@/components/student/InputZone';
import { TutorActivity } from '@/components/peripheral/TutorActivity';
import { BootstrapProgress } from '@/components/peripheral/BootstrapProgress';
import { MentionPopup } from '@/components/student/MentionPopup';
import { SlashCommandPopup } from '@/components/student/SlashCommandPopup';
import { MarginNote } from '@/components/tutor/MarginNote';
import { ThreadArc } from '@/components/tutor/ThreadArc';
import { NotebookPastSession } from './NotebookPastSession';
import { NotebookModeToggle } from './NotebookModeToggle';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookCanvas } from './NotebookCanvas';
import { KnowledgeCanvas } from '@/components/canvas/KnowledgeCanvas';
import { useMarginLayout, useWideViewport } from '@/hooks/useMarginLayout';
import { useConversationClusters } from '@/hooks/useConversationClusters';
import { useScrollContext } from '@/hooks/useScrollContext';
import { ClusterBreath } from '@/components/peripheral/ClusterBreath';
import { ScrollReference } from '@/components/peripheral/ScrollReference';
import { ConversationRibbon } from '@/components/peripheral/ConversationRibbon';
import type { NotebookMode } from './NotebookModeToggle';
import type { LiveEntry } from '@/types/entries';
import type { SessionRecord } from '@/persistence/records';
import type { useContentDrop } from '@/hooks/useContentDrop';
import type { usePopupState } from '@/hooks/usePopupState';
import { isStudentEntry as isStudentType } from './entryTypeMeta';
import { useEntryKeyboardNav } from '@/hooks/useEntryKeyboardNav';
import { ResponsePlanPreview } from '@/components/tutor/ResponsePlanPreview';
import { CrossNavBreadcrumb } from '@/components/peripheral/CrossNavBreadcrumb';
import { VoiceMode } from '@/components/student/VoiceMode';
import { NotebookEmptyState } from './NotebookEmptyState';
import type { ResponsePlan } from '@/hooks/useResponseOrchestrator';
import type { CrossNavState } from '@/hooks/useNotebookCrossNav';
import styles from './Notebook.module.css';

export interface NotebookContentProps {
  entries: LiveEntry[];
  pinnedEntries: LiveEntry[];
  past: SessionRecord[];
  current: SessionRecord | null;
  sessionId: string | null;
  mode: NotebookMode;
  setMode: (m: NotebookMode) => void;
  marginalRef: string | null;
  contentDrop: ReturnType<typeof useContentDrop>;
  popup: ReturnType<typeof usePopupState>;
  isThinking: boolean;
  responsePlans?: ResponsePlan[];
  bottomRef: React.RefObject<HTMLDivElement>;
  handleSubmit: (text: string) => void;
  handleSubmitTyped: (text: string, type: string) => void;
  handleSketchSubmit: (dataUrl: string) => void;
  /** Voice session state — renders the non-blocking voice bar at viewport bottom. */
  voiceSession?: {
    state: 'idle' | 'connecting' | 'active' | 'error';
    error: string | null;
    transcript: Array<{ role: 'user' | 'tutor'; text: string; timestamp: number; final: boolean }>;
    isTutorSpeaking: boolean;
    elapsed: number;
    start: () => Promise<void>;
    stop: () => void;
    debugStatus?: string;
  };
  /** Cross-mode navigation state (graph↔linear↔canvas). */
  crossNav?: {
    navState: CrossNavState;
    hasBreadcrumb: boolean;
    goToEntry: (entryId: string, label: string) => void;
    goToGraphNode: (nodeId: string, label: string) => void;
    goBack: () => void;
    dismissBreadcrumb: () => void;
  };
}

export function NotebookContent({
  entries, pinnedEntries, past, current, sessionId, mode, setMode,
  marginalRef, contentDrop, popup, isThinking, responsePlans, bottomRef,
  handleSubmit, handleSubmitTyped, handleSketchSubmit, voiceSession, crossNav,
}: NotebookContentProps) {
  const { containerRef: kbNavRef, handleKeyDown: handleKbNav } = useEntryKeyboardNav();
  const wideViewport = useWideViewport();
  const layout = useMarginLayout(entries, wideViewport);
  const clusters = useConversationClusters(entries);
  const scrollCtx = useScrollContext(entries);

  // Group entries by cluster for ribbon rendering
  const clusterGroups = useMemo(() => {
    const groups = new Map<number, string[]>();
    for (const le of entries) {
      const info = clusters.get(le.id);
      if (!info) continue;
      let group = groups.get(info.clusterIndex);
      if (!group) { group = []; groups.set(info.clusterIndex, group); }
      group.push(le.id);
    }
    return [...groups.values()].filter((g) => g.length >= 2);
  }, [entries, clusters]);

  const voiceActive = voiceSession && voiceSession.state !== 'idle';

  return (
    <>
    <div style={voiceActive ? { paddingBottom: 56 } : undefined}>
    <Column>
      {past.map((s) => <NotebookPastSession key={s.id} session={s} />)}
      {past.length > 0 && <SessionDivider />}
      {current && (
        <SessionHeader sessionNumber={current.number} date={current.date}
          timeOfDay={current.timeOfDay} topic={current.topic} />
      )}
      <NotebookModeToggle mode={mode} setMode={setMode} />
      {crossNav?.hasBreadcrumb && (
        <CrossNavBreadcrumb
          sourceMode={crossNav.navState.sourceMode}
          entityLabel={crossNav.navState.entityLabel}
          onBack={crossNav.goBack}
          onDismiss={crossNav.dismissBreadcrumb}
        />
      )}
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
          <div ref={kbNavRef} className={styles.entryContainer}
            onDrop={contentDrop.handleDrop} onDragOver={contentDrop.handleDragOver}
            onKeyDown={handleKbNav} aria-live="polite" aria-relevant="additions"
          >
            {marginalRef && <MarginZone><MarginalReference>{marginalRef}</MarginalReference></MarginZone>}
            {wideViewport && clusterGroups.map((ids, i) => (
              <ConversationRibbon key={i} entryIds={ids} />
            ))}
            {entries.length === 0 ? (
              <NotebookEmptyState />
            ) : entries.map((le, i) => {
              if (layout.isInMargin(le.id)) return (
                <div key={le.id} data-entry-id={le.id} className={styles.marginAnchor} />
              );
              const prev = i > 0 ? entries[i - 1] : null;
              const prevIsStudent = prev ? isStudentType(prev.entry.type) : false;
              const pair = layout.pairForStudent(le.id);
              const isConn = pair?.tutorType === 'tutor-connection';
              const cluster = clusters.get(le.id);
              return (
                <div key={le.id}>
                  {cluster?.isClusterStart && <ClusterBreath />}
                  <div className={styles.entryRow}>
                    <NotebookEntryWrapper liveEntry={le} index={i + 1} prevIsStudent={prevIsStudent} />
                    {pair && <MarginNote isConnection={isConn}>{pair.tutorContent}</MarginNote>}
                    {pair && <ThreadArc isConnection={isConn} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={scrollCtx.isScrolling ? styles.inputFaded : styles.inputZone}>
            {scrollCtx.referenceSnippet && (
              <ScrollReference
                snippet={scrollCtx.referenceSnippet}
                onClear={scrollCtx.clearReference}
                onScrollTo={() => {
                  const el = scrollCtx.referencedEntry
                    ? document.querySelector(`[data-entry-id="${scrollCtx.referencedEntry.id}"]`)
                    : null;
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            )}
            {popup.mentionQuery !== null && (
              <MentionPopup query={popup.mentionQuery} results={popup.mentionResults}
                onSelect={(e) => popup.handleMentionSelect(e)}
                onCreate={popup.handleMentionCreate}
                onClose={popup.handlePopupClose} />
            )}
            {popup.slashQuery !== null && (
              <SlashCommandPopup query={popup.slashQuery}
                onSelect={(c) => popup.handleSlashSelect(c)} onClose={popup.handlePopupClose} />
            )}
            {responsePlans && responsePlans.length > 0 && <ResponsePlanPreview plans={responsePlans} />}
            <BootstrapProgress />
            <TutorActivity />
            <InputZone onSubmit={(t) => { handleSubmit(t); scrollCtx.clearReference(); }}
              onSubmitTyped={(t, ty) => { handleSubmitTyped(t, ty); scrollCtx.clearReference(); }}
              onSketchSubmit={handleSketchSubmit} onMentionTrigger={popup.handleMentionTrigger}
              onSlashTrigger={popup.handleSlashTrigger} onPopupClose={popup.handlePopupClose}
              afterQuestion={entries.length > 0 && entries[entries.length - 1]?.entry.type === 'tutor-question'}
              onPaste={contentDrop.handlePaste} insertText={popup.pendingInsert}
              onInsertConsumed={popup.handleInsertConsumed}
              popupOpen={popup.mentionQuery !== null || popup.slashQuery !== null}
              disabled={isThinking}
              voiceSession={voiceSession} />
          </div>
          <div ref={bottomRef} />
        </>
      ) : mode === 'canvas' ? (
        <NotebookCanvas sessionId={sessionId} entries={entries}
          onCardClick={crossNav?.goToEntry} />
      ) : (
        <KnowledgeCanvas
          onNodeNavigate={crossNav?.goToEntry}
          focusNodeId={crossNav?.navState.entityId ?? undefined} />
      )}
    </Column>
    </div>
    {/* Voice bar: fixed to viewport bottom, notebook remains interactive */}
    {voiceSession && voiceSession.state !== 'idle' && (
      <VoiceMode
        state={voiceSession.state}
        transcript={voiceSession.transcript}
        isTutorSpeaking={voiceSession.isTutorSpeaking}
        elapsed={voiceSession.elapsed}
        error={voiceSession.error}
        debugStatus={voiceSession.debugStatus}
        onStop={voiceSession.stop}
      />
    )}
    </>
  );
}
