/**
 * File Search Store — manages the per-student File Search store lifecycle.
 * One store per student. Metadata filtering separates notebooks and types.
 *
 * API reference: https://ai.google.dev/api/file-search/file-search-stores
 */
import { getGeminiClient } from '../gemini';

let cachedStoreName: string | null = null;
let cachedStudentId: string | null = null;

/** Create or retrieve the student's File Search store. */
export async function getOrCreateStore(studentId: string): Promise<string> {
  if (cachedStoreName && cachedStudentId === studentId) {
    return cachedStoreName;
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const displayName = `ember-student-${studentId}`;

  const stores = await client.fileSearchStores.list();
  for await (const store of stores) {
    if (store.displayName === displayName && store.name) {
      cachedStoreName = store.name;
      cachedStudentId = studentId;
      return store.name;
    }
  }

  const store = await client.fileSearchStores.create({
    config: { displayName },
  });

  if (!store.name) throw new Error('Failed to create File Search store');
  cachedStoreName = store.name;
  cachedStudentId = studentId;
  return store.name;
}

/**
 * Delete a student's File Search store and all its documents.
 * Uses force=true to cascade-delete all contained documents/chunks.
 */
export async function deleteStore(storeName: string): Promise<void> {
  const client = getGeminiClient();
  if (!client) return;

  await client.fileSearchStores.delete({
    name: storeName,
    config: { force: true },
  });

  // Clear cache if this was the cached store
  if (cachedStoreName === storeName) {
    cachedStoreName = null;
    cachedStudentId = null;
  }
}

/**
 * Metadata entry for File Search documents.
 * Supports three value types per the API:
 *   - string_value: single string
 *   - numeric_value: number (int or decimal)
 *   - string_list_value: array of strings
 *
 * Max 20 metadata entries per document.
 */
export type MetadataEntry =
  | { key: string; string_value: string }
  | { key: string; numeric_value: number }
  | { key: string; string_list_value: string[] };

/** Upload a text document to the store with metadata. */
export async function uploadDocument(
  storeName: string,
  displayName: string,
  content: string,
  metadata: MetadataEntry[],
): Promise<void> {
  const client = getGeminiClient();
  if (!client) return;

  const blob = new Blob([content], { type: 'text/plain' });

  await client.fileSearchStores.uploadToFileSearchStore({
    file: blob,
    fileSearchStoreName: storeName,
    config: { displayName, customMetadata: metadata },
  });
}

/** Upload a raw file (PDF, image, code) directly. */
export async function uploadRawFile(
  storeName: string,
  file: Blob,
  displayName: string,
  notebookId: string,
  extraMetadata?: MetadataEntry[],
): Promise<void> {
  const client = getGeminiClient();
  if (!client) return;

  const metadata: MetadataEntry[] = [
    { key: 'type', string_value: 'uploaded-file' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'indexedAt', numeric_value: Date.now() },
    ...(extraMetadata ?? []),
  ];

  await client.fileSearchStores.uploadToFileSearchStore({
    file,
    fileSearchStoreName: storeName,
    config: { displayName, customMetadata: metadata },
  });
}
