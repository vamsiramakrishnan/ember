/**
 * File Search Indexing — converts notebook content into searchable documents.
 * Each content type has its own indexing function with rich metadata.
 */
import { uploadDocument, type MetadataEntry } from './store';

/** Index a session's dialogue entries with rich metadata. */
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
  const lines = [
    `# Session ${session.number}: ${session.topic}`,
    `Date: ${session.date}`,
    '',
    ...session.entries
      .filter((e) => e.content)
      .map((e) => `[${formatType(e.type)}]: ${e.content}\n`),
  ];

  const signals = extractSignals(session.entries);

  const metadata: MetadataEntry[] = [
    { key: 'type', string_value: 'session' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'sessionNumber', numeric_value: session.number },
    { key: 'topic', string_value: session.topic },
    { key: 'hasQuestions', string_value: String(signals.hasQuestions) },
    { key: 'hasHypotheses', string_value: String(signals.hasHypotheses) },
    { key: 'entryCount', numeric_value: session.entries.length },
  ];

  if (signals.thinkers) {
    metadata.push({ key: 'thinkers', string_value: signals.thinkers });
  }
  if (signals.concepts) {
    metadata.push({ key: 'concepts', string_value: signals.concepts });
  }

  await uploadDocument(storeName, `session-${session.number}-${session.date}`, lines.join('\n'), metadata);
}

/** Index lexicon entries. */
export async function indexLexicon(
  storeName: string,
  notebookId: string,
  entries: Array<{
    term: string; definition: string; etymology: string;
    crossReferences: string[]; level: string; percentage: number;
  }>,
): Promise<void> {
  if (entries.length === 0) return;

  const lines = entries.map((e) => {
    const parts = [`## ${e.term}`, `Definition: ${e.definition}`, `Mastery: ${e.level} (${e.percentage}%)`];
    if (e.etymology) parts.push(`Etymology: ${e.etymology}`);
    if (e.crossReferences.length > 0) parts.push(`Cross-references: ${e.crossReferences.join(', ')}`);
    return parts.join('\n');
  });

  const mastered = entries.filter((e) => e.level === 'mastered').length;
  const terms = entries.map((e) => e.term).join(', ');

  await uploadDocument(storeName, `lexicon-${notebookId}`, `# Vocabulary\n\n${lines.join('\n\n')}`, [
    { key: 'type', string_value: 'lexicon' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'termCount', numeric_value: entries.length },
    { key: 'masteredCount', numeric_value: mastered },
    { key: 'terms', string_value: terms },
  ]);
}

/** Index encounter records. */
export async function indexEncounters(
  storeName: string,
  notebookId: string,
  encounters: Array<{
    thinker: string; tradition: string; coreIdea: string;
    date: string; status: string;
  }>,
): Promise<void> {
  if (encounters.length === 0) return;

  const lines = encounters.map((e) =>
    `## ${e.thinker}\nTradition: ${e.tradition}\nCore idea: ${e.coreIdea}\nStatus: ${e.status}`,
  );

  const names = encounters.map((e) => e.thinker).join(', ');
  const active = encounters.filter((e) => e.status === 'active').length;

  await uploadDocument(storeName, `encounters-${notebookId}`, `# Thinkers\n\n${lines.join('\n\n')}`, [
    { key: 'type', string_value: 'encounter' },
    { key: 'notebookId', string_value: notebookId },
    { key: 'thinkerNames', string_value: names },
    { key: 'thinkerCount', numeric_value: encounters.length },
    { key: 'activeCount', numeric_value: active },
  ]);
}

/** Index library entries. */
export async function indexLibrary(
  storeName: string,
  notebookId: string,
  texts: Array<{
    title: string; author: string; quote: string;
    annotationCount: number; isCurrent: boolean;
  }>,
): Promise<void> {
  if (texts.length === 0) return;

  const lines = texts.map((t) =>
    `## ${t.title} by ${t.author}\n${t.isCurrent ? '(Current)' : ''}\nAnnotations: ${t.annotationCount}\nQuote: "${t.quote}"`,
  );

  await uploadDocument(storeName, `library-${notebookId}`, `# Reading\n\n${lines.join('\n\n')}`, [
    { key: 'type', string_value: 'library' },
    { key: 'notebookId', string_value: notebookId },
  ]);
}

/** Index mastery data. */
export async function indexMastery(
  storeName: string, notebookId: string,
  concepts: Array<{ concept: string; level: string; percentage: number }>,
): Promise<void> {
  if (concepts.length === 0) return;
  const lines = concepts.map((c) => `- ${c.concept}: ${c.level} (${c.percentage}%)`);
  await uploadDocument(storeName, `mastery-${notebookId}`, `# Mastery\n\n${lines.join('\n')}`, [
    { key: 'type', string_value: 'mastery' },
    { key: 'notebookId', string_value: notebookId },
  ]);
}

/** Index curiosity questions. */
export async function indexCuriosities(
  storeName: string, notebookId: string, questions: string[],
): Promise<void> {
  if (questions.length === 0) return;
  const lines = questions.map((q) => `- ${q}`);
  await uploadDocument(storeName, `curiosities-${notebookId}`, `# Questions\n\n${lines.join('\n')}`, [
    { key: 'type', string_value: 'curiosity' },
    { key: 'notebookId', string_value: notebookId },
  ]);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatType(type: string): string {
  const map: Record<string, string> = {
    prose: 'Student', question: 'Student question', hypothesis: 'Student hypothesis',
    scratch: 'Student note', 'tutor-marginalia': 'Tutor', 'tutor-question': 'Tutor question',
    'tutor-connection': 'Tutor connection', silence: 'Silence',
  };
  return map[type] ?? type;
}

function extractSignals(entries: Array<{ type: string; content?: string }>) {
  let hasQuestions = false, hasHypotheses = false;
  const text = entries.filter((e) => e.content).map((e) => e.content).join(' ');

  for (const e of entries) {
    if (e.type === 'question') hasQuestions = true;
    if (e.type === 'hypothesis') hasHypotheses = true;
  }

  const names = new Set<string>();
  const nameRe = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g;
  let m;
  while ((m = nameRe.exec(text)) !== null) if (m[1]) names.add(m[1]);

  const concepts = new Set<string>();
  const conceptRe = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  while ((m = conceptRe.exec(text)) !== null) {
    const t = m[1] ?? m[2];
    if (t) concepts.add(t);
  }

  return {
    hasQuestions, hasHypotheses,
    thinkers: [...names].slice(0, 10).join(', '),
    concepts: [...concepts].slice(0, 10).join(', '),
  };
}
