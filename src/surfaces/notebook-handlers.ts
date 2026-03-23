/**
 * notebook-handlers — pure factory functions for Notebook action callbacks.
 * Each returns a handler function that can be wrapped in useCallback.
 * Keeps Notebook.tsx focused on hook wiring and JSX.
 */
import { branchNotebook } from '@/services/notebook-branch';
import { addRelation } from '@/state';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import type { StudentRecord, NotebookRecord } from '@/persistence/records';

/** Derive the marginal reference text from the most recent relevant entry. */
export function deriveMarginalRef(entries: LiveEntry[]): string | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]?.entry;
    if (!e) continue;
    if (e.type === 'tutor-connection') return e.content.slice(0, 120) + (e.content.length > 120 ? '…' : '');
    if (e.type === 'echo') return e.content;
  }
  return null;
}
interface BranchDeps {
  student: StudentRecord | null;
  notebook: NotebookRecord | null;
  setNotebook: (nb: NotebookRecord) => void;
}

export async function handleBranch(
  { student, notebook, setNotebook }: BranchDeps,
  _id: string,
  content: string,
): Promise<void> {
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
}

interface SelectionActionDeps {
  annotate: (entryId: string, note: string) => Promise<void>;
  submitEntry: (entry: NotebookEntry) => void;
  popup: { handleMentionTrigger: (query: string) => void };
}

export function handleSelectionAction(
  { annotate, submitEntry, popup }: SelectionActionDeps,
  entryId: string,
  actionType: string,
  selectedText: string,
): void {
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
}

export function handleFollowUp(
  submitEntry: (entry: NotebookEntry) => void,
  entries: LiveEntry[],
  question: string,
  tutorContext: string,
): void {
  const contextHint = tutorContext.length > 100
    ? tutorContext.slice(0, 100) + '…'
    : tutorContext;
  const fullQuestion = `Regarding your note "${contextHint}" — ${question}`;
  const tutorEntry = entries.find(
    (le) => 'content' in le.entry && le.entry.content === tutorContext,
  );
  submitEntry({ type: 'question', content: fullQuestion });
  if (tutorEntry) {
    const questionId = entries[entries.length - 1]?.id;
    if (questionId) {
      addRelation({
        from: questionId,
        to: tutorEntry.id,
        type: 'follow-up',
        meta: question.slice(0, 80),
      });
    }
  }
}
