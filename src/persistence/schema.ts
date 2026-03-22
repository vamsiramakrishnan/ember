/**
 * Ember DB Schema — v3: multi-student, multi-notebook.
 *
 * New stores: students, notebooks
 * All domain stores now indexed by studentId for isolation.
 * Sessions scoped to notebooks. Entries scoped to sessions.
 */

export const DB_NAME = 'ember-notebook';
export const DB_VERSION = 3;

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
      { name: 'by-term', keyPath: ['studentId', 'term'], unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Encounters,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-ref', keyPath: ['studentId', 'ref'], unique: true },
      { name: 'by-thinker', keyPath: 'thinker' },
      { name: 'by-status', keyPath: 'status' },
    ],
  },
  {
    name: Store.Library,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-title', keyPath: ['studentId', 'title'], unique: true },
    ],
  },
  {
    name: Store.Mastery,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
      { name: 'by-concept', keyPath: ['studentId', 'concept'], unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Curiosities,
    keyPath: 'id',
    indexes: [
      { name: 'by-student', keyPath: 'studentId' },
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
