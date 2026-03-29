/** InputZone (7.4) — student's writing area. See: 06-component-inventory.md */
import { useState, useRef, useCallback, useEffect } from 'react';
import { inferEntryType } from '@/hooks/useEntryInference';
import { useMicrophoneInput } from '@/hooks/useMicrophoneInput';
import { detectTrigger, replaceTrigger } from './trigger-detect';
import { SketchInput } from './SketchInput';
import { VoiceMode } from './VoiceMode';
import { BlockInserter } from './BlockInserter';
import { InputAffordances } from './InputAffordances';
import { ChipPreviewBar } from './ChipPreviewBar';
import { MathPreview } from '@/primitives/MathPreview';
import type { StudentEntryType, NotebookEntry } from '@/types/entries';
import styles from './InputZone.module.css';

const typeLabels: Record<StudentEntryType, string> = {
  prose: '', question: 'question', hypothesis: 'hypothesis', scratch: 'note',
};

interface InputZoneProps {
  onSubmit?: (content: string) => void;
  onSubmitTyped?: (content: string, type: StudentEntryType) => void;
  onSketchSubmit?: (dataUrl: string) => void;
  onMentionTrigger?: (query: string) => void;
  onSlashTrigger?: (query: string) => void;
  onPopupClose?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  insertText?: string | null;
  onInsertConsumed?: () => void;
  popupOpen?: boolean;
  disabled?: boolean;
  /** Whether the last tutor entry was a Socratic question. */
  afterQuestion?: boolean;
  /** Voice Mode: callback to add entries from voice session function calls. */
  onVoiceEntry?: (entry: NotebookEntry) => void;
  /** Voice session hook — if provided, enables Voice Mode (long-press mic). */
  voiceSession?: {
    state: 'idle' | 'connecting' | 'active' | 'error';
    error: string | null;
    transcript: Array<{ role: 'user' | 'tutor'; text: string; timestamp: number; final: boolean }>;
    isTutorSpeaking: boolean;
    elapsed: number;
    start: () => Promise<void>;
    stop: () => void;
  };
}

export function InputZone({
  onSubmit, onSubmitTyped, onSketchSubmit,
  onMentionTrigger, onSlashTrigger, onPopupClose, onPaste,
  insertText, onInsertConsumed, popupOpen, disabled, afterQuestion,
  voiceSession,
}: InputZoneProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [forcedType, setForcedType] = useState<StudentEntryType | null>(null);

  // Microphone input: short press = dictation, long press = Voice Mode
  const handleTranscript = useCallback((text: string) => {
    setValue((prev) => prev ? `${prev} ${text}` : text);
  }, []);
  const mic = useMicrophoneInput(handleTranscript);

  // Long-press detection for Voice Mode activation
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const longPressTriggered = useRef(false);
  const handleMicPointerDown = useCallback(() => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      if (voiceSession && voiceSession.state === 'idle') {
        void voiceSession.start();
      }
    }, 500);
  }, [voiceSession]);
  const handleMicPointerUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
    if (!longPressTriggered.current) {
      // Short press — toggle dictation
      void mic.toggleRecording();
    }
  }, [mic]);
  /* Submission morph: brief color transition before clearing.
   * was: instant clear, now: 200ms color morph → clear
   * reason: smooths the most frequent interaction in the app (audit P9) */
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerPos = useRef(-1);
  const pendingCursorPos = useRef<number | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    if (pendingCursorPos.current !== null && el) {
      const pos = pendingCursorPos.current;
      pendingCursorPos.current = null;
      requestAnimationFrame(() => {
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    }
  }, [value]);

  useEffect(() => {
    if (!insertText || triggerPos.current < 0) return;
    const pos = triggerPos.current;
    pendingCursorPos.current = pos + insertText.length;
    setValue((prev) => replaceTrigger(prev, pos, insertText));
    triggerPos.current = -1;
    onInsertConsumed?.();
  }, [insertText, onInsertConsumed]);

  const submit = useCallback((text: string, type?: StudentEntryType) => {
    const resolved = type ?? forcedType;
    /* Morph phase: text stays visible but shifts color for 200ms before clearing */
    setSubmitting(true);
    if (resolved && onSubmitTyped) onSubmitTyped(text, resolved);
    else onSubmit?.(text);
    setTimeout(() => {
      setValue(''); setForcedType(null); triggerPos.current = -1; onPopupClose?.();
      setSubmitting(false);
    }, 200);
  }, [forcedType, onSubmit, onSubmitTyped, onPopupClose]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);
    const trigger = detectTrigger(text, cursor);
    if (trigger.type === 'mention') {
      triggerPos.current = trigger.position;
      onMentionTrigger?.(trigger.query); return;
    }
    if (trigger.type === 'slash') {
      triggerPos.current = trigger.position;
      onSlashTrigger?.(trigger.query); return;
    }
    triggerPos.current = -1;
    onPopupClose?.();
  }, [onMentionTrigger, onSlashTrigger, onPopupClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (popupOpen && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
        e.preventDefault(); submit(value.trim());
      }
      if (e.key === 'Escape') {
        if (forcedType) setForcedType(null);
        onPopupClose?.();
      }
    }, [value, submit, forcedType, onPopupClose, popupOpen]);

  const handleBlockSelect = useCallback(
    (type: StudentEntryType) => { setForcedType(type); textareaRef.current?.focus(); }, []);

  if (sketchMode) return <SketchInput
    onSubmit={(d) => { onSketchSubmit?.(d); setSketchMode(false); }}
    onCancel={() => setSketchMode(false)} />;

  const inferredType = value.trim() ? inferEntryType(value.trim()) : null;
  const displayType = forcedType ? typeLabels[forcedType] || forcedType : inferredType ? typeLabels[inferredType] : '';

  return (
    <div className={`${styles.container} ${afterQuestion ? styles.afterQuestion : ''}`}
      onClick={() => textareaRef.current?.focus()}>
      <BlockInserter onSelect={handleBlockSelect} />
      {forcedType && <div className={styles.forcedTypeBar}>
        <span className={styles.forcedTypeLabel}>{forcedType}</span>
        <button className={styles.forcedTypeClear} aria-label="Clear entry type"
          onClick={(e) => { e.stopPropagation(); setForcedType(null); }}>esc</button>
      </div>}
      <textarea ref={textareaRef}
        className={`${styles.textarea} ${submitting ? styles.textareaSubmitting : ''}`}
        value={value} onChange={handleChange}
        onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown} onPaste={onPaste}
        rows={1} disabled={disabled}
        aria-label="Write your thoughts" aria-busy={disabled} />
      <ChipPreviewBar value={value} />
      <MathPreview value={value} />
      {!isFocused && !value && !forcedType && <>
        <div className={disabled ? styles.cursorThinking : styles.cursor} aria-hidden="true" />
        {!disabled && <span className={styles.hint}>What are you thinking about?</span>}
      </>}
      <div className={styles.bottomRow}>
        {displayType && !forcedType && <span key={displayType} className={
          inferredType === 'question' ? styles.typeIndicatorQuestion
          : inferredType === 'hypothesis' ? styles.typeIndicatorHypothesis
          : inferredType === 'scratch' ? styles.typeIndicatorScratch
          : styles.typeIndicator}>{displayType}</span>}
        <div className={styles.bottomActions}>
          <button
            className={`${styles.micButton} ${mic.state === 'recording' ? styles.micRecording : ''} ${mic.state === 'transcribing' ? styles.micTranscribing : ''} ${voiceSession && voiceSession.state !== 'idle' ? styles.micVoiceActive : ''}`}
            aria-label={mic.state === 'recording' ? 'Stop recording' : mic.state === 'transcribing' ? 'Transcribing…' : voiceSession ? 'Tap to dictate, hold for voice mode' : 'Record audio'}
            onPointerDown={(e) => { e.stopPropagation(); handleMicPointerDown(); }}
            onPointerUp={(e) => { e.stopPropagation(); handleMicPointerUp(); }}
            onPointerLeave={() => { clearTimeout(longPressTimer.current); }}
            disabled={mic.state === 'transcribing' || disabled || (voiceSession?.state !== 'idle' && voiceSession?.state !== undefined)}
          >
            {mic.state === 'recording' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="8" height="8" rx="1" />
              </svg>
            ) : mic.state === 'transcribing' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={styles.micSpinner}>
                <circle cx="7" cy="7" r="5" strokeDasharray="20 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <rect x="5" y="1" width="4" height="8" rx="2" />
                <path d="M3 7a4 4 0 0 0 8 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <line x1="7" y1="11" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            )}
          </button>
          <button className={styles.sketchToggle} aria-label="Switch to sketch mode"
            onClick={(e) => { e.stopPropagation(); setSketchMode(true); }}>sketch</button>
        </div>
      </div>
      {mic.error && <p className={styles.micError}>{mic.error}</p>}
      <InputAffordances />
      {voiceSession && voiceSession.state !== 'idle' && (
        <VoiceMode
          state={voiceSession.state}
          transcript={voiceSession.transcript}
          isTutorSpeaking={voiceSession.isTutorSpeaking}
          elapsed={voiceSession.elapsed}
          error={voiceSession.error}
          onStop={voiceSession.stop}
        />
      )}
    </div>
  );
}
