/**
 * Ember DB Schema — v4: notebook-scoped constellation data.
 *
 * Breaking change: Lexicon, Encounters, Library, Mastery, and
 * Curiosities now carry notebookId for per-notebook isolation.
 * Unique indexes updated to compound [notebookId, ...] keys.
 */

export const DB_NAME = 'ember-notebook';
export const DB_VERSION = 4;

export const Store = {
  Students: 'students',
  Notebooks: 'notebooks',
  Sessions: 'sessions',
  Entries: 'entries',
  Lexicon: 'lexicon',
  Encounters: 'encounters',
  Library: 'library',
  Mastery: 'mastery',
  Curiosities: 'curiosities',
  Blobs: 'blobs',
  Canvas: 'canvas',
} as const;

export type StoreName = (typeof Store)[keyof typeof Store];

interface IndexDef {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

interface StoreDef {
  name: StoreName;
  keyPath: string;
  indexes: IndexDef[];
}

export const stores: StoreDef[] = [
  {
    name: Store.Students,
    keyPath: 'id',
    indexes: [
      { name: 'by-name', keyPath: 'name' },
      { name: 'by-created', keyPath: 'createdAt' },
    ],
  },
  {
    name: Store.Notebooks,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-active', keyPath: ['studentId', 'isActive'] },
      { name: 'by-created', keyPath: 'createdAt' },
    ],
  },
  {
    name: Store.Sessions,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
      { name: 'by-number', keyPath: ['notebookId', 'number'] },
      { name: 'by-created', keyPath: 'createdAt' },
    ],
  },
  {
    name: Store.Entries,
    keyPath: 'id',
    indexes: [
      { name: 'by-session', keyPath: 'sessionId' },
      { name: 'by-order', keyPath: ['sessionId', 'order'] },
      { name: 'by-pinned', keyPath: 'pinned' },
      { name: 'by-bookmarked', keyPath: 'bookmarked' },
      { name: 'by-type', keyPath: 'type' },
    ],
  },
  {
    name: Store.Lexicon,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
      { name: 'by-term', keyPath: ['notebookId', 'term'], unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Encounters,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
      { name: 'by-ref', keyPath: ['notebookId', 'ref'], unique: true },
      { name: 'by-thinker', keyPath: 'thinker' },
      { name: 'by-status', keyPath: 'status' },
    ],
  },
  {
    name: Store.Library,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
      { name: 'by-title', keyPath: ['notebookId', 'title'], unique: true },
    ],
  },
  {
    name: Store.Mastery,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
      { name: 'by-concept', keyPath: ['notebookId', 'concept'], unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Curiosities,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-notebook', keyPath: 'notebookId' },
    ],
  },
  {
    name: Store.Blobs,
    keyPath: 'hash',
    indexes: [
      { name: 'by-mime', keyPath: 'mimeType' },
      { name: 'by-created', keyPath: 'createdAt' },
      { name: 'by-ref', keyPath: 'refId' },
    ],
  },
  {
    name: Store.Canvas,
    keyPath: 'id',
    indexes: [
      { name: 'by-session', keyPath: 'sessionId', unique: true },
    ],
  },
];
