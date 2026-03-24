/**
 * Notebook Bootstrap DAG — rich content generation for new notebooks.
 *
 * Constructs a deterministic multi-wave IntentDAG from the notebook's
 * title and guiding question, then executes it through the standard
 * DAG executor. Each node produces actual notebook entries that appear
 * progressively as the student watches.
 *
 * Runs in parallel with the existing bootstrapNotebook() which handles
 * constellation data seeding (thinkers, vocab, mastery, library).
 *
 * Wave 1 (parallel): research + opening greeting
 * Wave 2 (parallel, depends on research): thinker connections + vocabulary + concept map
 * Wave 3 (depends on wave 2): introductory reading material
 */
import type { IntentDAG, IntentNode } from './intent-dag';
import type { NodeResult } from './dag-executor';
import { executeDAG, collectEntries } from './dag-executor';
import { dispatchNode } from './dag-dispatcher';
import { isGeminiAvailable } from './gemini';
import { refineContent } from './content-refiner';
import { bootstrapNotebook } from './notebook-bootstrap';
import { generateNotebookIcon } from './notebook-enrichment';
import { Store, notify } from '@/persistence';
import { createEntry } from '@/persistence/repositories/entries';
import type { NotebookEntry } from '@/types/entries';

type EntryCallback = (entries: NotebookEntry[], label: string) => void;

/** Build a deterministic bootstrap DAG from notebook metadata. */
export function buildBootstrapDAG(title: string, question: string): IntentDAG {
  const topic = question ? `${title} — ${question}` : title;

  const q = question ? `The student's guiding question is: "${question}".` : '';
  const nodes: IntentNode[] = [
    // Wave 1: parallel foundation
    { id: 'research', action: 'research',
      content: `Research "${topic}" in depth. Find key thinkers, foundational concepts, surprising connections, primary sources, and historical context.`,
      entities: [], dependsOn: [], parallel: true, label: 'researching topic' },
    { id: 'opening', action: 'respond',
      content: `Write a warm opening for a notebook on "${topic}". ${q} Reference what makes this fascinating. 2-3 sentences, no exclamation marks.`,
      entities: [], dependsOn: [], parallel: true, label: 'welcoming' },
    // Wave 2: depends on research, all parallel
    { id: 'connect', action: 'connect',
      content: `Introduce the most important thinker connected to "${topic}". Show why their work matters.`,
      entities: [], dependsOn: ['research'], parallel: true, label: 'introducing thinkers' },
    { id: 'landscape', action: 'visualize',
      content: `Create a concept map of "${topic}" with 4-6 key concepts and typed edges (causes, enables, contrasts, extends).`,
      entities: [], dependsOn: ['research'], parallel: true, label: 'mapping concepts' },
    { id: 'teach', action: 'teach',
      content: `Create a reading material deck introducing "${topic}". Cover foundations, key ideas, historical context. 6-8 slides with timelines, tables, and diagrams.`,
      entities: [], dependsOn: ['research'], parallel: true, label: 'creating reading material' },
    // Wave 3: depends on teach/connect
    { id: 'vocab', action: 'define',
      content: `Define the 3 most important technical terms in "${topic}" with etymology and usage context.`,
      entities: [], dependsOn: ['teach'], parallel: true, label: 'building vocabulary' },
    { id: 'cards', action: 'flashcards',
      content: `Create 6 flashcards for active recall on the key concepts of "${topic}". Fronts are Socratic questions, backs teach.`,
      entities: [], dependsOn: ['teach'], parallel: true, label: 'creating study cards' },
    { id: 'question', action: 'quiz',
      content: `Ask a genuinely interesting opening Socratic question about "${topic}" that makes the student want to explore. Something they can attempt with everyday knowledge.`,
      entities: [], dependsOn: ['connect'], parallel: false, label: 'opening question' },
  ];

  return {
    nodes,
    rootId: 'opening',
    isCompound: true,
    summary: `Bootstrap notebook: ${title}`,
  };
}

/** Execute a bootstrap DAG, calling onEntries as each node completes. */
export async function executeBootstrapDAG(
  dag: IntentDAG,
  notebookId: string,
  onEntries?: EntryCallback,
): Promise<NotebookEntry[]> {
  if (!isGeminiAvailable()) return [];

  const dispatcher = (
    node: IntentNode, d: IntentDAG,
    prior: Map<string, NodeResult>,
  ) => dispatchNode(node, d, prior, undefined, notebookId);

  const results = await executeDAG(dag, dispatcher, (_id, status, label) => {
    if (status === 'active' && onEntries) {
      onEntries([], label);
    }
  });

  // Refine reading material if generated (critique loop)
  for (const [nodeId, result] of results) {
    if (!result.success) continue;
    for (let i = 0; i < result.entries.length; i++) {
      const entry = result.entries[i]!;
      if (entry.type === 'reading-material' || entry.type === 'flashcard-deck') {
        const node = dag.nodes.find((n) => n.id === nodeId);
        const refined = await refineContent(entry, node?.content ?? '').catch(() => null);
        if (refined?.entry) result.entries[i] = refined.entry;
      }
    }
  }

  // Emit entries per node as they become available
  const allEntries = collectEntries(dag, results);
  if (onEntries) {
    for (const entry of allEntries) {
      const label = 'content' in entry ? 'content ready' : entry.type;
      onEntries([entry], label);
    }
  }

  return allEntries;
}

/**
 * Full bootstrap pipeline — three parallel tracks.
 * Called fire-and-forget after the student navigates into the notebook.
 *
 * Track 1: Constellation seeding (thinkers, vocab, mastery, library)
 * Track 2: Rich content DAG (opening, concept map, connections, question)
 * Track 3: Icon generation
 */
export async function runBootstrapPipeline(
  studentId: string, notebookId: string, sessionId: string,
  title: string, question: string,
): Promise<void> {
  const dag = buildBootstrapDAG(title, question);

  const addEntry = async (entry: NotebookEntry) => {
    await createEntry(sessionId, entry);
    notify(Store.Entries);
  };

  await Promise.all([
    bootstrapNotebook(studentId, notebookId, title, question)
      .catch((err) => console.error('[Bootstrap] Constellation:', err)),

    executeBootstrapDAG(dag, notebookId, async (entries) => {
      for (const e of entries) {
        await addEntry(e).catch((err) => console.error('[Bootstrap] Entry:', err));
      }
    }).catch((err) => console.error('[Bootstrap] DAG:', err)),

    generateNotebookIcon(notebookId, title, question).catch(() => null),
  ]);
}
