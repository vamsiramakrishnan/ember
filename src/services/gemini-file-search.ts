/**
 * Gemini File Search — managed RAG for notebook content.
 * Indexes student entries, tutor responses, and session history
 * into a searchable knowledge store. Enables semantic search
 * across the student's entire intellectual history.
 *
 * Uses: gemini-3-flash-preview with fileSearch tool.
 */
import { getGeminiClient } from './gemini';

const FILE_SEARCH_MODEL = 'gemini-3-flash-preview';

/** Cached store name for the current student. */
let studentStoreName: string | null = null;

/**
 * Create or retrieve the student's File Search store.
 * One store per student — all their notebooks indexed here.
 */
export async function getOrCreateStore(
  studentId: string,
): Promise<string> {
  if (studentStoreName) return studentStoreName;

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const displayName = `ember-student-${studentId}`;

  // Try to find existing store
  const stores = await client.fileSearchStores.list();
  for await (const store of stores) {
    if (store.displayName === displayName && store.name) {
      studentStoreName = store.name;
      return store.name;
    }
  }

  // Create new store
  const store = await client.fileSearchStores.create({
    config: { displayName },
  });

  if (!store.name) throw new Error('Failed to create File Search store');
  studentStoreName = store.name;
  return store.name;
}

/**
 * Index a notebook session into the File Search store.
 * Converts session entries into a structured document
 * and uploads it for semantic search.
 */
export async function indexSession(
  storeName: string,
  session: {
    number: number;
    date: string;
    topic: string;
    entries: Array<{ type: string; content?: string }>;
  },
): Promise<void> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  // Build a structured text document from the session
  const lines: string[] = [
    `# Session ${session.number}`,
    `Date: ${session.date}`,
    `Topic: ${session.topic}`,
    '',
  ];

  for (const entry of session.entries) {
    if (!entry.content) continue;
    const label = formatEntryType(entry.type);
    lines.push(`[${label}]: ${entry.content}`);
    lines.push('');
  }

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });

  // Upload to the store
  await client.fileSearchStores.uploadToFileSearchStore({
    file: blob,
    fileSearchStoreName: storeName,
    config: {
      displayName: `session-${session.number}-${session.date}`,
    },
  });
}

/**
 * Search the student's indexed notebooks for relevant context.
 * Returns grounded text with citations from past sessions.
 */
export async function searchNotebooks(
  storeName: string,
  query: string,
  systemInstruction?: string,
): Promise<{ text: string; citations: string[] }> {
  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const config: Record<string, unknown> = {
    tools: [{
      fileSearch: {
        fileSearchStoreNames: [storeName],
      },
    }],
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

function formatEntryType(type: string): string {
  switch (type) {
    case 'prose': return 'Student';
    case 'question': return 'Student question';
    case 'hypothesis': return 'Student hypothesis';
    case 'scratch': return 'Student scratch';
    case 'tutor-marginalia': return 'Tutor';
    case 'tutor-question': return 'Tutor question';
    case 'tutor-connection': return 'Tutor connection';
    case 'silence': return 'Silence';
    default: return type;
  }
}
