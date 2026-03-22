/**
 * File Search Store — manages the per-student File Search store lifecycle.
 * One store per student. Metadata filtering separates notebooks.
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

export type MetadataEntry = {
  key: string;
  string_value?: string;
  numeric_value?: number;
};

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
    ...(extraMetadata ?? []),
  ];

  await client.fileSearchStores.uploadToFileSearchStore({
    file,
    fileSearchStoreName: storeName,
    config: { displayName, customMetadata: metadata },
  });
}
