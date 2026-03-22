/**
 * Union type for all notebook entry types.
 *
 * The notebook is a free-flowing canvas of typed blocks:
 * - Student blocks: prose, scratch, hypothesis, question, sketch
 * - Tutor blocks: marginalia, questions, connections, thinker cards, diagrams
 * - Rich content: code cells, file uploads, embeds, documents, images
 * - System: silence, divider, echo, bridge-suggestion
 * - AI-generated: visualizations (HTML), illustrations (images)
 *
 * Think: Jupyter meets a quiet notebook. Every block can carry
 * annotations from both student and tutor.
 */

export interface DiagramNode {
  label: string;
  subLabel?: string;
}

export interface Thinker {
  name: string;
  dates: string;
  gift: string;
  bridge: string;
}

/** Annotation that can be attached to any entry — optionally targeting a text span. */
export interface EntryAnnotation {
  id: string;
  author: 'student' | 'tutor';
  content: string;
  timestamp: number;
  /** Character offset: start of the highlighted span in the entry's content. */
  spanStart?: number;
  /** Character offset: end of the highlighted span. */
  spanEnd?: number;
  /** Category of annotation for visual treatment. */
  kind?: 'insight' | 'trivia' | 'question' | 'connection' | 'correction';
  /** If this annotation references another entry, its ID. */
  sourceEntryId?: string;
}

/** Code cell execution result. */
export interface CodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** File metadata for uploaded content. */
export interface FileAttachment {
  name: string;
  mimeType: string;
  size: number;
  blobHash: string;
}

export type NotebookEntry =
  // ─── Student blocks ──────────────────────────────────────────
  | { type: 'prose'; content: string }
  | { type: 'scratch'; content: string }
  | { type: 'hypothesis'; content: string }
  | { type: 'question'; content: string }
  | { type: 'sketch'; dataUrl: string }

  // ─── Tutor blocks ────────────────────────────────────────────
  | { type: 'tutor-marginalia'; content: string }
  | { type: 'tutor-question'; content: string }
  | { type: 'tutor-connection'; content: string; emphasisEnd: number }
  | { type: 'concept-diagram'; items: DiagramNode[] }
  | { type: 'thinker-card'; thinker: Thinker }

  // ─── Rich content blocks ────────────────────────────────────
  | { type: 'code-cell'; language: string; source: string; result?: CodeResult }
  | { type: 'image'; dataUrl: string; alt?: string; caption?: string }
  | { type: 'file-upload'; file: FileAttachment; summary?: string }
  | { type: 'embed'; url: string; title?: string; description?: string; favicon?: string }
  | { type: 'document'; file: FileAttachment; pages?: number; extractedText?: string }

  // ─── AI-generated blocks ─────────────────────────────────────
  | { type: 'visualization'; html: string; caption?: string }
  | { type: 'illustration'; dataUrl: string; caption?: string }

  // ─── System blocks ──────────────────────────────────────────
  | { type: 'silence'; text?: string }
  | { type: 'divider'; label?: string }
  | { type: 'echo'; content: string }
  | { type: 'bridge-suggestion'; content: string }
  | { type: 'tutor-reflection'; content: string }
  | { type: 'tutor-directive'; content: string; action?: string }
  | { type: 'citation'; sources: Array<{ title: string; url: string }> };

/** A notebook entry with metadata for live notebook interaction. */
export interface LiveEntry {
  id: string;
  entry: NotebookEntry;
  crossedOut: boolean;
  bookmarked: boolean;
  pinned: boolean;
  /** Timestamp of creation. */
  timestamp: number;
  /** Annotations from student and tutor. */
  annotations?: EntryAnnotation[];
}

/** Student entry types — these are the types the student can create. */
export type StudentEntryType = 'prose' | 'scratch' | 'hypothesis' | 'question';

/** All block types the student can insert via the + menu. */
export type InsertableBlockType =
  | StudentEntryType
  | 'code-cell'
  | 'image'
  | 'file-upload'
  | 'embed'
  | 'sketch';
