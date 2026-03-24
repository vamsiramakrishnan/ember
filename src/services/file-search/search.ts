/**
 * File Search Queries — search across indexed student content
 * with metadata filtering for notebook, type, and combined scoping.
 *
 * All queries scope by both type AND notebook when possible,
 * to avoid cross-contamination between content types.
 *
 * API reference: https://ai.google.dev/gemini-api/docs/file-search
 */
import { getGeminiClient, MODELS } from '../gemini';

const FILE_SEARCH_MODEL = MODELS.text;

export interface SearchResult {
  text: string;
  citations: string[];
}

/** Search across ALL indexed content for a student (no filters). */
export async function searchAll(
  storeName: string,
  query: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  return search(storeName, query, undefined, systemInstruction);
}

/**
 * Search past sessions within a specific notebook.
 * Scoped to type="session" AND notebookId to avoid returning
 * lexicon/mastery/library docs that share the same notebook.
 */
export async function searchNotebook(
  storeName: string,
  query: string,
  notebookId: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  const filter = `type = "session" AND notebookId = "${notebookId}"`;
  return search(storeName, query, filter, systemInstruction);
}

/** Search for specific content types, optionally scoped to a notebook. */
export async function searchByType(
  storeName: string,
  query: string,
  type: string,
  notebookId?: string,
): Promise<SearchResult> {
  let filter = `type = "${type}"`;
  if (notebookId) filter += ` AND notebookId = "${notebookId}"`;
  return search(storeName, query, filter);
}

/**
 * Combined filter search — for complex queries that need
 * multiple metadata conditions.
 */
export async function searchWithFilter(
  storeName: string,
  query: string,
  metadataFilter: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  return search(storeName, query, metadataFilter, systemInstruction);
}

/** Internal: execute a search with optional metadata filter. */
async function search(
  storeName: string,
  query: string,
  metadataFilter?: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const fileSearchConfig: Record<string, unknown> = {
    fileSearchStoreNames: [storeName],
  };
  if (metadataFilter) {
    fileSearchConfig.metadataFilter = metadataFilter;
  }

  const config: Record<string, unknown> = {
    tools: [{ fileSearch: fileSearchConfig }],
  };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await client.models.generateContent({
    model: FILE_SEARCH_MODEL,
    config,
    contents: query,
  });

  const text = response.text ?? '';
  const citations: string[] = [];

  const metadata = response.candidates?.[0]?.groundingMetadata;
  if (metadata && 'groundingChunks' in metadata) {
    const chunks = metadata.groundingChunks as Array<Record<string, unknown>>;
    for (const chunk of chunks) {
      if ('retrievedContext' in chunk) {
        const ctx = chunk.retrievedContext as Record<string, string>;
        if (ctx.title) citations.push(ctx.title);
      }
    }
  }

  return { text, citations };
}
