/**
 * Sync types — the contract between local and remote storage.
 *
 * Design philosophy: the notebook is local-first.
 * - Writes are instant (IndexedDB)
 * - Every write is recorded in an operation log
 * - The log flushes to a remote mirror when online
 * - On a new device, the log replays to reconstruct state
 * - Sync is invisible. No spinners. No "syncing..." text.
 */
import type { StoreName } from '../schema';

/** A single mutation recorded in the operation log. */
export interface SyncOperation {
  /** Unique operation ID (time-sortable). */
  id: string;
  /** Which store was mutated. */
  store: StoreName;
  /** What kind of mutation. */
  action: 'put' | 'delete';
  /** The record key (id or hash for blobs). */
  key: string;
  /** The full record payload (for puts). Undefined for deletes. */
  payload?: unknown;
  /** Client-side timestamp. */
  timestamp: number;
  /** Has this operation been confirmed by the server? */
  synced: boolean;
}

/** A blob upload queued for sync. */
export interface BlobUpload {
  /** The blob's content-addressed hash. */
  hash: string;
  /** MIME type. */
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** Has this blob been uploaded? */
  synced: boolean;
}

/**
 * SyncAdapter — provider-agnostic interface for remote storage.
 * Implement this for Supabase, a REST API, or any other backend.
 */
export interface SyncAdapter {
  /** Push a batch of operations to the server. Returns confirmed op IDs. */
  pushOperations(ops: SyncOperation[]): Promise<string[]>;

  /** Pull operations from the server since a given timestamp. */
  pullOperations(since: number): Promise<SyncOperation[]>;

  /** Upload a blob to remote storage. */
  uploadBlob(hash: string, blob: Blob, mimeType: string): Promise<void>;

  /** Download a blob from remote storage. */
  downloadBlob(hash: string): Promise<Blob | null>;

  /** Check if the remote is reachable. */
  isOnline(): Promise<boolean>;
}

/** Sync status — observable state for the quiet UI indicator. */
export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncStatus {
  state: SyncState;
  /** Number of operations waiting to sync. */
  pending: number;
  /** Last successful sync timestamp. */
  lastSyncAt: number | null;
  /** Error message if state is 'error'. */
  error?: string;
}
