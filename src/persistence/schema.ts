/**
 * Ember DB Schema — the complete persistence model.
 *
 * Architecture inspired by Notion's block model:
 * - Every piece of content has identity (id), lineage (parentId), and time
 * - Entries are ordered within sessions via a fractional index
 * - Blobs are content-addressed (SHA-256 hash as key)
 * - All stores support indexed queries
 *
 * Stores:
 *   sessions    — Session containers (the "pages")
 *   entries     — Notebook entries within sessions (the "blocks")
 *   lexicon     — Personal vocabulary (Constellation → Lexicon)
 *   encounters  — Thinker encounters (Constellation → Encounters)
 *   library     — Primary texts (Constellation → Library)
 *   mastery     — Concept mastery state
 *   curiosities — Open questions / threads
 *   blobs       — Content-addressed binary storage
 *   canvas      — Spatial layout per session
 */

export const DB_NAME = 'ember-notebook';
export const DB_VERSION = 2;

export const Store = {
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

/** Every store, its key, and its queryable indexes. */
export const stores: StoreDef[] = [
  {
    name: Store.Sessions,
    keyPath: 'id',
    indexes: [
      { name: 'by-number', keyPath: 'number', unique: true },
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
      { name: 'by-term', keyPath: 'term', unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Encounters,
    keyPath: 'id',
    indexes: [
      { name: 'by-ref', keyPath: 'ref', unique: true },
      { name: 'by-thinker', keyPath: 'thinker' },
      { name: 'by-status', keyPath: 'status' },
    ],
  },
  {
    name: Store.Library,
    keyPath: 'id',
    indexes: [
      { name: 'by-title', keyPath: 'title', unique: true },
    ],
  },
  {
    name: Store.Mastery,
    keyPath: 'id',
    indexes: [
      { name: 'by-concept', keyPath: 'concept', unique: true },
      { name: 'by-level', keyPath: 'level' },
    ],
  },
  {
    name: Store.Curiosities,
    keyPath: 'id',
    indexes: [],
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
