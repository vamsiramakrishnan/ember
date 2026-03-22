/**
 * Blob Repository — content-addressed binary storage.
 * Sketches, images, and attachments stored by SHA-256 hash.
 * Duplicate content is automatically deduplicated.
 */
import { Store } from '../schema';
import { get, put, del, getByIndex } from '../engine';
import type { BlobRecord } from '../records';

/** Compute SHA-256 hash of binary data. Returns hex string. */
async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Convert a data URL (e.g. from canvas.toDataURL) to a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Convert a Blob back to a data URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Store a blob. Returns the content-addressed hash.
 * If identical content already exists, returns existing hash (dedup).
 */
export async function storeBlob(
  blob: Blob,
  refId?: string,
): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hash = await sha256(buffer);

  const existing = await get<BlobRecord>(Store.Blobs, hash);
  if (existing) return hash;

  const record: BlobRecord = {
    hash,
    data: blob,
    mimeType: blob.type,
    size: blob.size,
    createdAt: Date.now(),
    refId,
  };
  await put(Store.Blobs, record);
  return hash;
}

/**
 * Store a data URL as a blob. Returns the content-addressed hash.
 * Converts the data URL to a Blob first, then stores.
 */
export async function storeDataUrl(
  dataUrl: string,
  refId?: string,
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  return storeBlob(blob, refId);
}

/** Retrieve a blob by its hash. Returns undefined if not found. */
export async function getBlob(hash: string): Promise<BlobRecord | undefined> {
  return get<BlobRecord>(Store.Blobs, hash);
}

/** Retrieve a blob as a data URL. Returns undefined if not found. */
export async function getBlobAsDataUrl(
  hash: string,
): Promise<string | undefined> {
  const record = await getBlob(hash);
  if (!record) return undefined;
  return blobToDataUrl(record.data);
}

/** Get all blobs referencing a specific entry. */
export async function getBlobsByRef(refId: string): Promise<BlobRecord[]> {
  return getByIndex<BlobRecord>(Store.Blobs, 'by-ref', refId);
}

/** Delete a blob by hash. */
export async function deleteBlob(hash: string): Promise<void> {
  return del(Store.Blobs, hash);
}
