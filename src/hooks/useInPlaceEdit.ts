/**
 * useInPlaceEdit — enables in-place editing of notebook entries.
 *
 * Principles:
 * 1. Only student entries are directly editable (prose, scratch,
 *    hypothesis, question). The student owns their voice.
 * 2. Tutor entries are never edited by the student. If the tutor
 *    needs to revise, it patches the SAME entry (via patchEntryContent).
 * 3. Editing preserves the entry's position, type, and metadata.
 * 4. Double-click to enter edit mode. Enter to save. Escape to cancel.
 * 5. The edit state is local — only one entry edits at a time.
 *
 * The tutor-side mechanism:
 * When the tutor re-responds to the same context (e.g., the student
 * asks a follow-up), the orchestrator can choose to PATCH the existing
 * tutor entry rather than creating a new one. This is done via the
 * `patchEntryContent` function from usePersistedNotebook.
 * The visual effect: the tutor's text morphs in place, like a
 * handwritten note being rewritten on the same page.
 */
import { useState, useCallback } from 'react';
import { updateEntryContent } from '@/persistence/repositories/entries';
import { notify, Store } from '@/persistence';
import type { NotebookEntry } from '@/types/entries';

const EDITABLE_TYPES = new Set([
  'prose', 'scratch', 'hypothesis', 'question',
]);

interface UseInPlaceEditReturn {
  /** The entry ID currently being edited, or null. */
  editingId: string | null;
  /** Start editing an entry. Only works for student types. */
  startEdit: (entryId: string, entryType: string) => void;
  /** Cancel the current edit. */
  cancelEdit: () => void;
  /** Save the edited content. */
  saveEdit: (entryId: string, newContent: string, entryType?: string) => Promise<void>;
  /** Whether a given entry is currently being edited. */
  isEditing: (entryId: string) => boolean;
  /** Whether a given entry type is editable. */
  isEditable: (entryType: string) => boolean;
}

export function useInPlaceEdit(): UseInPlaceEditReturn {
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = useCallback((entryId: string, entryType: string) => {
    if (!EDITABLE_TYPES.has(entryType)) return;
    setEditingId(entryId);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const saveEdit = useCallback(async (
    entryId: string,
    newContent: string,
    entryType?: string,
  ) => {
    if (!newContent.trim()) {
      setEditingId(null);
      return;
    }

    // Construct the updated entry with the same type but new content
    const type = entryType ?? 'prose';
    const updatedEntry: NotebookEntry = {
      type: type as 'prose',
      content: newContent,
    };
    await updateEntryContent(entryId, updatedEntry);
    notify(Store.Entries);
    setEditingId(null);
  }, []);

  const isEditing = useCallback(
    (entryId: string) => editingId === entryId,
    [editingId],
  );

  const isEditable = useCallback(
    (entryType: string) => EDITABLE_TYPES.has(entryType),
    [],
  );

  return {
    editingId,
    startEdit,
    cancelEdit,
    saveEdit,
    isEditing,
    isEditable,
  };
}
