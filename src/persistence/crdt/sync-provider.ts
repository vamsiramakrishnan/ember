/**
 * CRDTSyncProvider — pushes/pulls Y.Doc binary updates via Supabase.
 *
 * Replaces the oplog-based sync engine with Yjs binary update exchange.
 * Updates are stored as base64-encoded binary in a `crdt_updates` table.
 * The provider runs on the same 30s interval as the previous sync engine
 * and exposes status compatible with the existing SyncStatus type.
 */
import * as Y from 'yjs';
import type { SyncStatus } from '../sync/types';

/** Shape of a row in the crdt_updates Supabase table. */
interface CRDTUpdateRow {
  notebook_id: string;
  update_data: string; // base64-encoded binary
  client_id: string;
  created_at: string;  // ISO 8601 timestamptz
}

interface ConnectionState {
  doc: Y.Doc;
  updateHandler: (update: Uint8Array, origin: unknown) => void;
  intervalId: ReturnType<typeof setInterval> | null;
  lastPullAt: string | null;
  clientId: string;
}

type StatusListener = (status: SyncStatus) => void;

/**
 * CRDTSyncProvider — manages Yjs binary update sync with Supabase.
 */
export class CRDTSyncProvider {
  private readonly supabaseUrl: string;
  private readonly anonKey: string;
  private readonly connections = new Map<string, ConnectionState>();
  private readonly statusListeners = new Set<StatusListener>();
  private currentStatus: SyncStatus = {
    state: 'idle',
    pending: 0,
    lastSyncAt: null,
  };
  private readonly clientId = generateClientId();

  constructor(config: { supabaseUrl: string; anonKey: string }) {
    this.supabaseUrl = config.supabaseUrl;
    this.anonKey = config.anonKey;
  }

  /** Start syncing a notebook's Y.Doc. */
  connect(notebookId: string, doc: Y.Doc, intervalMs = 30_000): void {
    if (this.connections.has(notebookId)) return;

    const pendingUpdates: Uint8Array[] = [];

    const updateHandler = (update: Uint8Array, origin: unknown): void => {
      // Only queue updates originating from local transactions.
      if (origin === 'remote') return;
      pendingUpdates.push(update);
    };

    doc.on('update', updateHandler);

    const runCycle = async (): Promise<void> => {
      try {
        this.emitStatus({ state: 'syncing' });

        // Push queued local updates.
        if (pendingUpdates.length > 0) {
          const merged = Y.mergeUpdates(pendingUpdates.splice(0));
          await this.pushUpdate(notebookId, merged);
        }

        // Pull remote updates.
        const conn = this.connections.get(notebookId);
        if (conn) {
          const remoteUpdates = await this.pullUpdates(notebookId, conn.lastPullAt);
          for (const row of remoteUpdates) {
            if (row.client_id === this.clientId) continue;
            const binary = base64ToUint8Array(row.update_data);
            Y.applyUpdate(doc, binary, 'remote');
          }
          if (remoteUpdates.length > 0) {
            const lastRow = remoteUpdates[remoteUpdates.length - 1];
            if (lastRow) conn.lastPullAt = lastRow.created_at;
          }
        }

        this.emitStatus({
          state: 'synced',
          pending: pendingUpdates.length,
          lastSyncAt: Date.now(),
          error: undefined,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.emitStatus({ state: 'error', error: msg });
      }
    };

    const intervalId = setInterval(() => void runCycle(), intervalMs);
    // Run initial sync immediately.
    void runCycle();

    this.connections.set(notebookId, {
      doc,
      updateHandler,
      intervalId,
      lastPullAt: null,
      clientId: this.clientId,
    });
  }

  /** Stop syncing a notebook. */
  disconnect(notebookId: string): void {
    const conn = this.connections.get(notebookId);
    if (!conn) return;
    conn.doc.off('update', conn.updateHandler);
    if (conn.intervalId) clearInterval(conn.intervalId);
    this.connections.delete(notebookId);
  }

  /** Force a sync cycle for a notebook. */
  async sync(notebookId: string): Promise<void> {
    const conn = this.connections.get(notebookId);
    if (!conn) return;
    // Trigger the update handler to collect any pending state.
    const sv = Y.encodeStateAsUpdate(conn.doc);
    await this.pushUpdate(notebookId, sv);
    const remoteUpdates = await this.pullUpdates(notebookId, conn.lastPullAt);
    for (const row of remoteUpdates) {
      if (row.client_id === this.clientId) continue;
      const binary = base64ToUint8Array(row.update_data);
      Y.applyUpdate(conn.doc, binary, 'remote');
    }
    if (remoteUpdates.length > 0) {
      const lastRow = remoteUpdates[remoteUpdates.length - 1];
      if (lastRow) conn.lastPullAt = lastRow.created_at;
    }
  }

  /** Destroy all connections. */
  destroy(): void {
    for (const notebookId of this.connections.keys()) {
      this.disconnect(notebookId);
    }
    this.statusListeners.clear();
  }

  /** Subscribe to sync status changes. Returns unsubscribe function. */
  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.currentStatus);
    return () => this.statusListeners.delete(fn);
  }

  /** Get current sync status snapshot. */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  private emitStatus(patch: Partial<SyncStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...patch };
    for (const fn of this.statusListeners) fn(this.currentStatus);
  }

  private async pushUpdate(notebookId: string, update: Uint8Array): Promise<void> {
    const body: CRDTUpdateRow = {
      notebook_id: notebookId,
      update_data: uint8ArrayToBase64(update),
      client_id: this.clientId,
      created_at: new Date().toISOString(),
    };

    const res = await fetch(`${this.supabaseUrl}/rest/v1/crdt_updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.anonKey,
        Authorization: `Bearer ${this.anonKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`CRDT push failed: ${res.status} ${res.statusText}`);
    }
  }

  private async pullUpdates(
    notebookId: string,
    since: string | null,
  ): Promise<CRDTUpdateRow[]> {
    const params = new URLSearchParams({
      notebook_id: `eq.${notebookId}`,
      order: 'created_at.asc',
      select: 'notebook_id,update_data,client_id,created_at',
    });
    if (since) {
      params.set('created_at', `gt.${since}`);
    }

    const res = await fetch(
      `${this.supabaseUrl}/rest/v1/crdt_updates?${params.toString()}`,
      {
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.anonKey}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`CRDT pull failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as CRDTUpdateRow[];
  }
}

/** Generate a random client ID for this browser tab. */
function generateClientId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('');
}

/** Encode Uint8Array to base64 string. */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

/** Decode base64 string to Uint8Array. */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
