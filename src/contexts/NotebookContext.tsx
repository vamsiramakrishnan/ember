/**
 * NotebookContext — centralised state for the active notebook session.
 *
 * Eliminates the 20+ prop drilling chain from Notebook → EntryWrapper
 * by providing entry actions, editing state, drag state, and popup
 * state through context. Every entry can access what it needs directly.
 *
 * Design: a single dispatch-style `onEntryAction` replaces the 12+
 * individual callbacks that were previously threaded through props.
 */
import {
  createContext, useContext, useCallback, useMemo,
} from 'react';
import type { ReactNode } from 'react';

// ─── Entry action union ────────────────────────────────────────────

export type EntryAction =
  | { type: 'cross-out'; id: string }
  | { type: 'toggle-bookmark'; id: string }
  | { type: 'toggle-pin'; id: string }
  | { type: 'annotate'; id: string; content: string }
  | { type: 'branch'; id: string; content: string }
  | { type: 'follow-up'; question: string; context: string }
  | { type: 'selection'; entryId: string; actionType: string; text: string }
  | { type: 'start-edit'; id: string; entryType: string }
  | { type: 'save-edit'; id: string; content: string; entryType: string }
  | { type: 'cancel-edit' };

// ─── Drag state ────────────────────────────────────────────────────

export interface DragState {
  dragId: string | null;
  overId: string | null;
}

export interface DragHandlers {
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragOver: (id: string, e: React.DragEvent) => void;
  onDragLeave: (id: string) => void;
  onDrop: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

// ─── Context shape ─────────────────────────────────────────────────

interface NotebookContextValue {
  /** Unified action dispatcher for all entry operations. */
  onEntryAction: (action: EntryAction) => void;
  /** The entry ID currently being edited, or null. */
  editingId: string | null;
  /** Drag-and-drop state. */
  drag: DragState;
  /** Drag-and-drop handlers. */
  dragHandlers: DragHandlers;
}

const NotebookCtx = createContext<NotebookContextValue | null>(null);

// ─── Hook ──────────────────────────────────────────────────────────

export function useNotebookActions(): NotebookContextValue {
  const ctx = useContext(NotebookCtx);
  if (!ctx) {
    throw new Error('useNotebookActions must be used within NotebookProvider');
  }
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────

interface NotebookProviderProps {
  children: ReactNode;
  /** Individual action handlers from the parent hooks. */
  crossOut: (id: string) => void;
  toggleBookmark: (id: string) => void;
  togglePin: (id: string) => void;
  annotate: (id: string, content: string) => void;
  onBranch: (id: string, content: string) => void;
  onFollowUp: (question: string, context: string) => void;
  onSelectionAction: (entryId: string, actionType: string, text: string) => void;
  startEdit: (id: string, entryType: string) => void;
  saveEdit: (id: string, content: string, entryType: string) => Promise<void>;
  cancelEdit: () => void;
  editingId: string | null;
  drag: DragState;
  dragHandlers: DragHandlers;
}

export function NotebookProvider({
  children,
  crossOut, toggleBookmark, togglePin, annotate,
  onBranch, onFollowUp, onSelectionAction,
  startEdit, saveEdit, cancelEdit, editingId,
  drag, dragHandlers,
}: NotebookProviderProps) {
  const onEntryAction = useCallback((action: EntryAction) => {
    switch (action.type) {
      case 'cross-out': crossOut(action.id); break;
      case 'toggle-bookmark': toggleBookmark(action.id); break;
      case 'toggle-pin': togglePin(action.id); break;
      case 'annotate': annotate(action.id, action.content); break;
      case 'branch': onBranch(action.id, action.content); break;
      case 'follow-up': onFollowUp(action.question, action.context); break;
      case 'selection': onSelectionAction(action.entryId, action.actionType, action.text); break;
      case 'start-edit': startEdit(action.id, action.entryType); break;
      case 'save-edit': void saveEdit(action.id, action.content, action.entryType); break;
      case 'cancel-edit': cancelEdit(); break;
    }
  }, [
    crossOut, toggleBookmark, togglePin, annotate,
    onBranch, onFollowUp, onSelectionAction,
    startEdit, saveEdit, cancelEdit,
  ]);

  const value = useMemo(() => ({
    onEntryAction,
    editingId,
    drag,
    dragHandlers,
  }), [onEntryAction, editingId, drag, dragHandlers]);

  return (
    <NotebookCtx.Provider value={value}>
      {children}
    </NotebookCtx.Provider>
  );
}
