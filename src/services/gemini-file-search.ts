/**
 * Gemini File Search — managed RAG for the student's entire
 * intellectual history. Indexes ALL content:
 *
 * - Sessions (dialogue entries)
 * - Lexicon (vocabulary with definitions, etymology)
 * - Encounters (thinker history)
 * - Library (primary texts)
 * - Mastery (concept progression)
 * - Curiosities (open questions)
 *
 * Each document is tagged with metadata for filtered queries:
 * - notebookId: scope searches to a specific notebook
 * - type: "session" | "lexicon" | "encounter" | "library" | "mastery" | "curiosity"
 *
 * Uses: gemini-3-flash-preview with fileSearch tool.
 */
import { getGeminiClient } from './gemini';

const FILE_SEARCH_MODEL = 'gemini-3-flash-preview';

/** Cached store name for the current student. */
let cachedStoreName: string | null = null;
let cachedStudentId: string | null = null;

// ─── Store lifecycle ─────────────────────────────────────────────────

/**
 * Create or retrieve the student's File Search store.
 * One store per student — all notebooks indexed here.
 * Metadata filtering separates notebooks at query time.
 */
export async function getOrCreateStore(
  studentId: string,
): Promise<string> {
  if (cachedStoreName && cachedStudentId === studentId) {
    return cachedStoreName;
  }

  const client = getGeminiClient();
  if (!client) throw new Error('Gemini API key not configured');

  const displayName = `ember-student-${studentId}`;

  // Try to find existing store
  const stores = await client.fileSearchStores.list();
  for await (const store of stores) {
    if (store.displayName === displayName && store.name) {
      cachedStoreName = store.name;
      cachedStudentId = studentId;
      return store.name;
    }
  }

  // Create new store
  const store = await client.fileSearchStores.create({
    config: { displayName },
  });

  if (!store.name) throw new Error('Failed to create File Search store');
  cachedStoreName = store.name;
  cachedStudentId = studentId;
  return store.name;
}

// ─── Content indexing ────────────────────────────────────────────────

/** Upload a text document to the store with metadata. */
async function uploadDocument(
  storeName: string,
  displayName: string,
  content: string,
  metadata: Array<{ key: string; string_value?: string; numeric_value?: number }>,
): Promise<void> {
  const client = getGeminiClient();
  if (!client) return;

  const blob = new Blob([content], { type: 'text/plain' });

  await client.fileSearchStores.uploadToFileSearchStore({
    file: blob,
    fileSearchStoreName: storeName,
    config: {
      displayName,
      customMetadata: metadata,
    },
  });
}

/** Index a session's dialogue entries. */
export async function indexSession(
  storeName: string,
  notebookId: string,
  session: {
    number: number;
    date: string;
    topic: string;
    entries: Array<{ type: string; content?: string }>;
  },
): Promise<void> {
  const lines: string[] = [
    `# Session ${session.number}: ${session.topic}`,
    `Date: ${session.date}`,
    '',
  ];

  for (const entry of session.entries) {
    if (!entry.content) continue;
    lines.push(`[${formatEntryType(entry.type)}]: ${entry.content}`);
    lines.push('');
  }

  await uploadDocument(
    storeName,
    `session-${session.number}-${session.date}`,
    lines.join('\n'),
    [
      { key: 'type', string_value: 'session' },
      { key: 'notebookId', string_value: notebookId },
      { key: 'sessionNumber', numeric_value: session.number },
    ],
  );
}

/** Index lexicon entries for a notebook. */
export async function indexLexicon(
  storeName: string,
  notebookId: string,
  entries: Array<{
    term: string;
    definition: string;
    etymology: string;
    crossReferences: string[];
    level: string;
    percentage: number;
  }>,
): Promise<void> {
  if (entries.length === 0) return;

  const lines = entries.map((e) => {
    const parts = [
      `## ${e.term}`,
      `Definition: ${e.definition}`,
      `Mastery: ${e.level} (${e.percentage}%)`,
    ];
    if (e.etymology) parts.push(`Etymology: ${e.etymology}`);
    if (e.crossReferences.length > 0) {
      parts.push(`Cross-references: ${e.crossReferences.join(', ')}`);
    }
    return parts.join('\n');
  });

  await uploadDocument(
    storeName,
    `lexicon-${notebookId}`,
    `# Student's Vocabulary\n\n${lines.join('\n\n')}`,
    [
      { key: 'type', string_value: 'lexicon' },
      { key: 'notebookId', string_value: notebookId },
    ],
  );
}

/** Index encounter records for a notebook. */
export async function indexEncounters(
  storeName: string,
  notebookId: string,
  encounters: Array<{
    thinker: string;
    tradition: string;
    coreIdea: string;
    date: string;
    status: string;
  }>,
): Promise<void> {
  if (encounters.length === 0) return;

  const lines = encounters.map((e) =>
    `## ${e.thinker}\nTradition: ${e.tradition}\nCore idea: ${e.coreIdea}\nStatus: ${e.status}\nDate: ${e.date}`,
  );

  await uploadDocument(
    storeName,
    `encounters-${notebookId}`,
    `# Thinker Encounters\n\n${lines.join('\n\n')}`,
    [
      { key: 'type', string_value: 'encounter' },
      { key: 'notebookId', string_value: notebookId },
    ],
  );
}

/** Index library entries for a notebook. */
export async function indexLibrary(
  storeName: string,
  notebookId: string,
  texts: Array<{
    title: string;
    author: string;
    quote: string;
    annotationCount: number;
    isCurrent: boolean;
  }>,
): Promise<void> {
  if (texts.length === 0) return;

  const lines = texts.map((t) =>
    `## ${t.title} by ${t.author}\n${t.isCurrent ? '(Currently reading)' : ''}\nAnnotations: ${t.annotationCount}\nKey quote: "${t.quote}"`,
  );

  await uploadDocument(
    storeName,
    `library-${notebookId}`,
    `# Reading List\n\n${lines.join('\n\n')}`,
    [
      { key: 'type', string_value: 'library' },
      { key: 'notebookId', string_value: notebookId },
    ],
  );
}

/** Index mastery progression for a notebook. */
export async function indexMastery(
  storeName: string,
  notebookId: string,
  concepts: Array<{
    concept: string;
    level: string;
    percentage: number;
  }>,
): Promise<void> {
  if (concepts.length === 0) return;

  const lines = concepts.map((c) =>
    `- ${c.concept}: ${c.level} (${c.percentage}%)`,
  );

  await uploadDocument(
    storeName,
    `mastery-${notebookId}`,
    `# Concept Mastery\n\n${lines.join('\n')}`,
    [
      { key: 'type', string_value: 'mastery' },
      { key: 'notebookId', string_value: notebookId },
    ],
  );
}

/** Index curiosity threads for a notebook. */
export async function indexCuriosities(
  storeName: string,
  notebookId: string,
  questions: string[],
): Promise<void> {
  if (questions.length === 0) return;

  const lines = questions.map((q) => `- ${q}`);

  await uploadDocument(
    storeName,
    `curiosities-${notebookId}`,
    `# Open Questions\n\n${lines.join('\n')}`,
    [
      { key: 'type', string_value: 'curiosity' },
      { key: 'notebookId', string_value: notebookId },
    ],
  );
}

// ─── Search queries ──────────────────────────────────────────────────

export interface SearchResult {
  text: string;
  citations: string[];
}

/**
 * Search across ALL of a student's indexed content.
 * Returns grounded text with citations.
 */
export async function searchAll(
  storeName: string,
  query: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  return search(storeName, query, undefined, systemInstruction);
}

/**
 * Search within a specific notebook only.
 * Uses metadata filtering on notebookId.
 */
export async function searchNotebook(
  storeName: string,
  query: string,
  notebookId: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  return search(storeName, query, `notebookId="${notebookId}"`, systemInstruction);
}

/**
 * Search for specific content types (sessions, lexicon, etc).
 */
export async function searchByType(
  storeName: string,
  query: string,
  type: 'session' | 'lexicon' | 'encounter' | 'library' | 'mastery' | 'curiosity',
  notebookId?: string,
): Promise<SearchResult> {
  let filter = `type="${type}"`;
  if (notebookId) {
    filter += ` AND notebookId="${notebookId}"`;
  }
  return search(storeName, query, filter);
}

/** Internal search with optional metadata filter. */
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

// ─── Legacy exports (backward compatibility) ─────────────────────────

/** @deprecated Use searchAll or searchNotebook instead. */
export async function searchNotebooks(
  storeName: string,
  query: string,
  systemInstruction?: string,
): Promise<SearchResult> {
  return searchAll(storeName, query, systemInstruction);
}

function formatEntryType(type: string): string {
  switch (type) {
    case 'prose': return 'Student';
    case 'question': return 'Student question';
    case 'hypothesis': return 'Student hypothesis';
    case 'scratch': return 'Student note';
    case 'tutor-marginalia': return 'Tutor';
    case 'tutor-question': return 'Tutor question';
    case 'tutor-connection': return 'Tutor connection';
    case 'silence': return 'Silence';
    default: return type;
  }
}
