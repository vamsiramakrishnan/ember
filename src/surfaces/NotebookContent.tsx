/**
 * NotebookContent — inner layout for the Notebook surface.
 * Renders past sessions, current session header, mode toggle,
 * pinned threads, and either linear entry list or canvas view.
 * See: 04-information-architecture.md, Surface one.
 */
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
import { NotebookPastSession } from './NotebookPastSession';
import { NotebookModeToggle } from './NotebookModeToggle';
import { NotebookEntryWrapper } from './NotebookEntryWrapper';
import { NotebookCanvas } from './NotebookCanvas';
import { KnowledgeCanvas } from '@/components/canvas/KnowledgeCanvas';
import type { NotebookMode } from './NotebookModeToggle';
import type { LiveEntry } from '@/types/entries';
import type { SessionRecord } from '@/persistence/records';
import type { useContentDrop } from '@/hooks/useContentDrop';
import type { usePopupState } from '@/hooks/usePopupState';
import { isStudentEntry as isStudentType } from './entryTypeMeta';
import { useEntryKeyboardNav } from '@/hooks/useEntryKeyboardNav';
import { ResponsePlanPreview } from '@/components/tutor/ResponsePlanPreview';
import type { ResponsePlan } from '@/hooks/useResponseOrchestrator';
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
}

export function NotebookContent({
  entries, pinnedEntries, past, current, sessionId, mode, setMode,
  marginalRef, contentDrop, popup, isThinking, responsePlans, bottomRef,
  handleSubmit, handleSubmitTyped, handleSketchSubmit,
}: NotebookContentProps) {
  const { containerRef: kbNavRef, handleKeyDown: handleKbNav } = useEntryKeyboardNav();

  return (
    <Column>
      {past.map((session) => (
        <NotebookPastSession key={session.id} session={session} />
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
      <NotebookModeToggle mode={mode} setMode={setMode} />
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
            ref={kbNavRef}
            className={styles.entryContainer}
            onDrop={contentDrop.handleDrop}
            onDragOver={contentDrop.handleDragOver}
            onKeyDown={handleKbNav}
            aria-live="polite"
            aria-relevant="additions"
          >
            {marginalRef && (
              <MarginZone>
                <MarginalReference>{marginalRef}</MarginalReference>
              </MarginZone>
            )}
            {entries.map((le, i) => {
              const prev = i > 0 ? entries[i - 1] : null;
              const prevIsStudent = prev ? isStudentType(prev.entry.type) : false;
              return (
                <div key={le.id} className={styles.entryRow}>
                  <NotebookEntryWrapper
                    liveEntry={le}
                    index={i + 1}
                    prevIsStudent={prevIsStudent}
                  />
                </div>
              );
            })}
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
            {responsePlans && responsePlans.length > 0 && (
              <ResponsePlanPreview plans={responsePlans} />
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
              popupOpen={popup.mentionQuery !== null || popup.slashQuery !== null}
              disabled={isThinking}
            />
          </div>
          <div ref={bottomRef} />
        </>
      ) : mode === 'canvas' ? (
        <NotebookCanvas sessionId={sessionId} entries={entries} />
      ) : (
        <KnowledgeCanvas />
      )}
    </Column>
  );
}
