/**
 * Supabase Sync Adapter — implements SyncAdapter for Supabase backend.
 *
 * Connects to:
 * - Supabase Postgres for structured data (operations table)
 * - Supabase Storage for blobs (sketches, images)
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.
 */
import type { SyncAdapter, SyncOperation } from './types';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucket?: string;
}

function headers(key: string): Record<string, string> {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

export function createSupabaseAdapter(config: SupabaseConfig): SyncAdapter {
  const { url, anonKey, bucket = 'ember-blobs' } = config;
  const rest = `${url}/rest/v1`;
  const storage = `${url}/storage/v1`;
  const hdrs = headers(anonKey);

  return {
    async pushOperations(ops: SyncOperation[]): Promise<string[]> {
      const rows = ops.map((op) => ({
        id: op.id,
        store: op.store,
        action: op.action,
        key: op.key,
        payload: op.payload ? JSON.stringify(op.payload) : null,
        client_timestamp: op.timestamp,
      }));

      const res = await fetch(`${rest}/sync_operations`, {
        method: 'POST',
        headers: { ...hdrs, 'Prefer': 'return=representation' },
        body: JSON.stringify(rows),
      });

      if (!res.ok) throw new Error(`Push failed: ${res.status}`);
      const inserted = await res.json() as { id: string }[];
      return inserted.map((r) => r.id);
    },

    async pullOperations(since: number): Promise<SyncOperation[]> {
      const res = await fetch(
        `${rest}/sync_operations?client_timestamp=gt.${since}&order=client_timestamp.asc`,
        { headers: hdrs },
      );
      if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
      const rows = await res.json() as {
        id: string; store: string; action: string; key: string;
        payload: string | null; client_timestamp: number;
      }[];

      return rows.map((r) => ({
        id: r.id,
        store: r.store as SyncOperation['store'],
        action: r.action as 'put' | 'delete',
        key: r.key,
        payload: r.payload ? JSON.parse(r.payload) : undefined,
        timestamp: r.client_timestamp,
        synced: true,
      }));
    },

    async uploadBlob(hash: string, blob: Blob, mimeType: string) {
      const res = await fetch(
        `${storage}/object/${bucket}/${hash}`,
        {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true',
          },
          body: blob,
        },
      );
      if (!res.ok) throw new Error(`Blob upload failed: ${res.status}`);
    },

    async downloadBlob(hash: string): Promise<Blob | null> {
      const res = await fetch(
        `${storage}/object/public/${bucket}/${hash}`,
        { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` } },
      );
      if (!res.ok) return null;
      return res.blob();
    },

    async isOnline(): Promise<boolean> {
      if (!navigator.onLine) return false;
      try {
        const res = await fetch(`${rest}/sync_operations?limit=0`, {
          headers: hdrs,
          signal: AbortSignal.timeout(3000),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}

/** Create adapter from Vite env vars. Returns null if not configured. */
export function createAdapterFromEnv(): SyncAdapter | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  return createSupabaseAdapter({ url, anonKey: key });
}
