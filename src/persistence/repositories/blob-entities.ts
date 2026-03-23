/**
 * BlobEntities — bridge between content-addressed blobs and
 * the knowledge graph. Makes uploaded files, images, and PDFs
 * first-class citizens that the AI tutor can discover, read,
 * and connect to concepts.
 *
 * Design: a blob stays in the Blobs store (binary, keyed by SHA-256).
 * This module creates Relations between the blob's parent entry
 * and other entities, making the content discoverable via graph
 * traversal.
 *
 * Example: Student uploads a PDF of Kepler's Harmonices Mundi.
 * → BlobRecord stored (hash, data, mimeType)
 * → EntryRecord created (type: 'document', file: { blobHash })
 * → Relation: entry --references--> TextEntity("Harmonices Mundi")
 * → Relation: entry --references--> ThinkerEntity("Kepler")
 * → Agent can find the PDF by traversing from Kepler or the concept
 */
import { getBlobsByRef, getBlobAsDataUrl } from './blobs';
import { getByIndex } from '../engine';
import { Store } from '../schema';
import { createRelation } from './graph';
import type { EntryRecord } from '../records';
import type { Relation, EntityKind, RelationType } from '@/types/entity';

/** Content metadata extracted from a blob for indexing. */
export interface BlobMeta {
  hash: string;
  mimeType: string;
  size: number;
  entryId: string;
  /** Human description — from alt text, filename, or AI extraction. */
  description: string;
  /** Category for search filtering. */
  category: 'image' | 'pdf' | 'document' | 'sketch' | 'other';
}

/**
 * Get all blob metadata for a notebook, resolved through entries.
 * Walks: notebook → sessions → entries → blobs.
 */
export async function getBlobsForNotebook(
  notebookId: string,
): Promise<BlobMeta[]> {
  const sessions = await getByIndex<{ id: string }>(
    Store.Sessions, 'by-notebook', notebookId,
  );

  const results: BlobMeta[] = [];

  for (const session of sessions) {
    const entries = await getByIndex<EntryRecord>(
      Store.Entries, 'by-session', session.id,
    );

    for (const entry of entries) {
      if (!entry.blobHash) continue;

      const blobs = await getBlobsByRef(entry.id);
      for (const blob of blobs) {
        results.push({
          hash: blob.hash,
          mimeType: blob.mimeType,
          size: blob.size,
          entryId: entry.id,
          description: extractDescription(entry),
          category: categorizeBlob(blob.mimeType),
        });
      }
    }
  }

  return results;
}

/**
 * Link an uploaded blob to entities in the knowledge graph.
 * Call this after a student uploads a file — it creates relations
 * from the entry to any mentioned concepts, thinkers, or texts.
 */
export async function linkBlobToGraph(
  entryId: string,
  notebookId: string,
  targets: Array<{
    entityId: string;
    entityKind: EntityKind;
    relationType: RelationType;
  }>,
): Promise<Relation[]> {
  const created: Relation[] = [];

  for (const target of targets) {
    const relation = await createRelation({
      notebookId,
      from: entryId,
      fromKind: 'entry',
      to: target.entityId,
      toKind: target.entityKind,
      type: target.relationType,
      weight: 0.9,
    });
    created.push(relation);
  }

  return created;
}

/**
 * Get a blob's content in a format suitable for AI agents.
 * Images → data URL (for multimodal). PDFs → extracted text placeholder.
 * Other → file metadata.
 */
export async function getBlobForAgent(
  hash: string,
  mimeType: string,
): Promise<{ type: 'image' | 'text' | 'metadata'; content: string }> {
  if (mimeType.startsWith('image/')) {
    const dataUrl = await getBlobAsDataUrl(hash);
    return {
      type: 'image',
      content: dataUrl ?? '(image unavailable)',
    };
  }

  // PDFs and documents — return metadata for now,
  // semantic search handles the actual content retrieval
  return {
    type: 'metadata',
    content: JSON.stringify({ hash, mimeType, note: 'Use search_history to query this document\'s content.' }),
  };
}

// ─── Helpers ──────────────────────────────────────────────

function extractDescription(entry: EntryRecord): string {
  const e = entry.entry;
  switch (e.type) {
    case 'image':
      return e.alt ?? e.caption ?? 'Student-uploaded image';
    case 'sketch':
      return 'Student sketch';
    case 'file-upload':
      return e.summary ?? e.file.name;
    case 'document':
      return e.extractedText?.slice(0, 100) ?? e.file.name;
    default:
      return 'Attached content';
  }
}

function categorizeBlob(mimeType: string): BlobMeta['category'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/') || mimeType.includes('document')) return 'document';
  return 'other';
}
