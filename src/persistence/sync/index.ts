/**
 * Sync module — public API.
 */
export type { SyncAdapter, SyncOperation, SyncStatus, SyncState } from './types';
export { registerAdapter, startSync, stopSync, sync, getSyncStatus } from './engine';
export { useSyncStatus } from './useSyncStatus';
export { createSupabaseAdapter, createAdapterFromEnv } from './supabase';
export { pendingCount, getLastSyncTimestamp } from './oplog';
export { queueBlobUpload, getPendingBlobs, markBlobSynced } from './blobQueue';
