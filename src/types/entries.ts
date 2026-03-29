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

import type { MasteryLevel } from './mastery';

export interface DiagramNode {
  label: string;
  subLabel?: string;
  /** Unique ID for graph linking. If set, this node maps to a graph entity. */
  entityId?: string;
  /** Entity kind for graph resolution. */
  entityKind?: 'concept' | 'thinker' | 'term' | 'question';
  /** Mastery level — drives visual treatment if present. */
  mastery?: { level: MasteryLevel; percentage: number };
  /** Children nodes — enables nested, expandable diagrams. */
  children?: DiagramNode[];
  /** Accent colour for the node. */
  accent?: 'sage' | 'indigo' | 'amber' | 'margin';
  /** Extended description shown on expand. */
  detail?: string;
}

/** Typed relationship between two DiagramNodes. */
export interface DiagramEdge {
  /** Index of source node in the items array. */
  from: number;
  /** Index of target node in the items array. */
  to: number;
  /** Relationship label (shown on the edge). */
  label?: string;
  /** Edge type for visual treatment. */
  type?: 'causes' | 'enables' | 'contrasts' | 'extends' | 'requires' | 'bridges';
  /** Edge weight for thickness (0–1). */
  weight?: number;
}

/**
 * Diagram layout — the tutor's pedagogical choice for how to arrange nodes.
 * Each layout is an SVG positioning algorithm applied to the same DiagramNode[] data.
 * The layout communicates the structural argument: a pyramid says "foundation matters,"
 * a cycle says "self-reinforcing," a flow says "sequential causation."
 */
export type DiagramLayout =
  | 'flow'           // A → B → C → D (process, cause chain, algorithm steps)
  | 'tree'           // top-down hierarchy (classification, taxonomy, org chart)
  | 'radial'         // center node with radiating connections (concept map, spider)
  | 'pyramid'        // layered foundation-to-peak (priority, abstraction levels)
  | 'cycle'          // circular loop (feedback, iterative process, seasons)
  | 'timeline'       // temporal sequence with date anchors (historical progression)
  | 'constellation'  // force-directed mini-canvas (complex webs, exploration)
  | 'graph';         // general typed-edge graph (default fallback)

export interface Thinker {
  name: string;
  dates: string;
  gift: string;
  bridge: string;
  /** AI-generated portrait (data URL). Populated on first encounter. */
  portraitUrl?: string;
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

/** A single slide/page in a reading material deck. */
export interface ReadingSlide {
  /** Slide heading. */
  heading: string;
  /** Markdown body content. */
  body: string;
  /** Optional speaker/tutor notes (not shown in main view). */
  notes?: string;
  /** Layout variant for visual treatment. */
  layout:
    | 'title' | 'content' | 'two-column' | 'quote' | 'diagram'
    | 'summary' | 'timeline' | 'table'
    | 'stat-cards' | 'process-flow' | 'pyramid' | 'comparison'
    | 'funnel' | 'cycle' | 'checklist' | 'matrix';
  /** Optional accent for the slide's decorative rule. */
  accent?: 'sage' | 'indigo' | 'amber' | 'margin';
  /** Structured timeline data (for layout='timeline'). */
  timeline?: Array<{ period: string; event: string; detail?: string }>;
  /** Structured table data (for layout='table'). */
  tableData?: { headers: string[]; rows: string[][] };
  /** Structured diagram items with optional edges (for layout='diagram'). */
  diagramItems?: Array<{ label: string; detail?: string }>;
  /** Key metrics (for layout='stat-cards'). 2-4 cards with large value + label. */
  statCards?: Array<{ value: string; label: string; detail?: string }>;
  /** Sequential process steps (for layout='process-flow'). */
  processSteps?: Array<{ step: string; detail?: string }>;
  /** Hierarchical pyramid layers, top (narrowest) to bottom (widest). */
  pyramidLayers?: Array<{ label: string; detail?: string }>;
  /** Side-by-side comparison with labeled columns. */
  comparisonData?: {
    leftLabel: string; rightLabel: string;
    leftPoints: string[]; rightPoints: string[];
  };
  /** Narrowing funnel stages from widest to narrowest. */
  funnelStages?: Array<{ stage: string; value?: string; detail?: string }>;
  /** Circular process loop steps. */
  cycleSteps?: Array<{ step: string; detail?: string }>;
  /** Key takeaway checklist. */
  checklistItems?: Array<{ item: string; checked?: boolean }>;
  /** 2×2 quadrant matrix with axis labels. */
  matrixData?: {
    topLabel: string; bottomLabel: string;
    leftLabel: string; rightLabel: string;
    quadrants: [string, string, string, string];
  };
  /** AI-generated illustration for this slide (data URL). */
  imageUrl?: string;
}

/** A single flashcard — front/back with optional metadata. */
export interface Flashcard {
  front: string;
  back: string;
  /** Source concept for mastery tracking. */
  concept?: string;
  /** Accent for visual treatment. */
  accent?: 'sage' | 'indigo' | 'amber' | 'margin';
  /** AI-generated visual mnemonic (data URL). */
  imageUrl?: string;
}

/** An exercise with a prompt, expected approach, and optional hints. */
export interface Exercise {
  prompt: string;
  /** What the tutor expects — used for evaluation, never shown. */
  approach: string;
  /** Progressive hints revealed on request. */
  hints?: string[];
  /** Exercise format. */
  format: 'open-response' | 'explain' | 'compare' | 'apply' | 'critique';
  /** Concept this tests. */
  concept?: string;
}

export type ExerciseDifficulty = 'foundational' | 'intermediate' | 'advanced';

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
  | { type: 'concept-diagram'; items: DiagramNode[]; edges?: DiagramEdge[]; title?: string; layout?: DiagramLayout }
  | { type: 'thinker-card'; thinker: Thinker }

  // ─── Rich content blocks ────────────────────────────────────
  | { type: 'code-cell'; language: string; source: string; result?: CodeResult }
  | { type: 'image'; dataUrl: string; alt?: string; caption?: string }
  | { type: 'file-upload'; file: FileAttachment; summary?: string }
  | { type: 'embed'; url: string; title?: string; description?: string; favicon?: string }
  | { type: 'document'; file: FileAttachment; pages?: number; extractedText?: string }

  // ─── AI-generated blocks ─────────────────────────────────────
  | { type: 'podcast'; topic: string; audioUrl: string; segments?: string[]; transcript: string; duration?: number; coverUrl?: string }
  | { type: 'visualization'; html: string; caption?: string }
  | { type: 'illustration'; dataUrl: string; caption?: string }
  | { type: 'reading-material'; title: string; subtitle?: string; slides: ReadingSlide[]; coverUrl?: string }
  | { type: 'flashcard-deck'; title: string; cards: Flashcard[]; sourceTopics?: string[] }
  | { type: 'exercise-set'; title: string; exercises: Exercise[]; difficulty: ExerciseDifficulty }

  // ─── Inline response blocks ───────────────────────────────
  | {
    type: 'inline-response';
    /** The quoted text the student selected. */
    quotedText: string;
    /** The tutor's contextual explanation / response. */
    content: string;
    /** ID of the source entry the quote was taken from. */
    sourceEntryId?: string;
    /** The action that triggered this (explain, define, connect). */
    intent: 'explain' | 'define' | 'connect';
  }

  // ─── System blocks ──────────────────────────────────────────
  | { type: 'silence'; text?: string }
  | { type: 'divider'; label?: string }
  | { type: 'echo'; content: string }
  | { type: 'bridge-suggestion'; content: string }
  | { type: 'tutor-reflection'; content: string }
  | { type: 'tutor-directive'; content: string; action?: string; completed?: boolean; completedAt?: number }
  | { type: 'citation'; sources: Array<{ title: string; url: string }> }
  | { type: 'streaming-text'; content: string; done: boolean };

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
