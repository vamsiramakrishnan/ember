/** DAG Dispatcher — routes IntentNodes to agents or dedicated generators. */
import type { IntentNode, IntentDAG } from './intent-dag';
import type { NodeResult } from './dag-executor';
import type { StreamChunkCallback } from './orchestrator';
import type { NotebookEntry, LiveEntry } from '@/types/entries';
import { TUTOR_AGENT } from './agents';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { parseTutorResponse } from './tutor-response-parser';
import { generateIllustration } from './enrichment';
import { generateReadingMaterial } from './reading-material-gen';
import { generateFlashcards } from './flashcard-gen';
import { generateExercises } from './exercise-gen';
import { resolveCommandContext } from './command-context';
import { setActivityDetail } from '@/state';
import { buildContext } from './dag-context';
import { buildPrompt } from './dag-prompts';
import { log, traceAgentDispatch } from '@/observability';

// ─── Activity labels for each action ───────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  respond: 'writing…', visualize: 'mapping concepts…',
  explain: 'preparing material…', illustrate: 'sketching…',
  research: 'researching…', define: 'defining…',
  connect: 'connecting ideas…', flashcards: 'creating study cards…',
  exercise: 'designing exercises…', quiz: 'preparing quiz…',
  summarize: 'summarizing…', timeline: 'building timeline…',
  teach: 'creating reading deck…', podcast: 'producing audio…',
  deepen: 'enriching content…', silence: '',
};

// ─── Rich content generators ─────────────────────────────────

type RichGenerator = (
  topic: string, entries: LiveEntry[], context?: string,
) => Promise<NotebookEntry | null>;

const RICH_GENERATORS: Record<string, RichGenerator> = {
  teach: generateReadingMaterial,
  explain: generateReadingMaterial,
  deepen: generateReadingMaterial,
  flashcards: generateFlashcards,
  exercise: generateExercises,
};

// ─── Step mapping ────────────────────────────────────────────

const STEP_MAP: Record<string, string> = {
  respond: 'streaming', visualize: 'visualizing', explain: 'thinking',
  illustrate: 'illustrating', research: 'researching', define: 'thinking',
  connect: 'thinking', flashcards: 'thinking', exercise: 'thinking',
  quiz: 'thinking', summarize: 'thinking', timeline: 'visualizing',
  teach: 'thinking', podcast: 'thinking', deepen: 'thinking', silence: 'reflecting',
};

const ANALYTICAL = new Set([
  'research', 'teach', 'flashcards', 'exercise', 'quiz', 'podcast', 'deepen',
]);

// ─── Dispatcher ─────────────────────────────────────────────

export async function dispatchNode(
  node: IntentNode, dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
  onChunk?: StreamChunkCallback, notebookId?: string,
): Promise<NodeResult> {
  if (node.action === 'silence') {
    return { nodeId: node.id, entries: [{ type: 'silence', text: undefined }], success: true };
  }

  log.breadcrumb('dag', `dispatch ${node.action}`, { nodeId: node.id });

  const priorCtx = buildContext(node, dag, priorResults);
  const tier = ANALYTICAL.has(node.action) ? 2 : 1;
  const cmdCtx = await resolveCommandContext(
    node.content, [], tier as 0 | 1 | 2, node.action, notebookId,
  );
  const context = [priorCtx, cmdCtx.formatted].filter(Boolean).join('\n\n');

  setActivityDetail({
    step: (STEP_MAP[node.action] ?? 'thinking') as 'thinking',
    label: ACTIVITY_LABELS[node.action] ?? 'processing…',
  });

  return traceAgentDispatch(`dag.${node.action}`, TUTOR_AGENT.model, async () => {
    // Illustrate → image agent
    if (node.action === 'illustrate') {
      return dispatchIllustrate(node, context);
    }

    // Rich content → dedicated generators (VISUALISER_AGENT + typed schemas)
    const richGen = RICH_GENERATORS[node.action];
    if (richGen) {
      return dispatchRich(node, richGen, context);
    }

    // Default → TUTOR_AGENT
    return dispatchTutor(node, buildPrompt(node, context), onChunk);
  });
}

async function dispatchIllustrate(node: IntentNode, ctx: string): Promise<NodeResult> {
  try {
    const entry = await generateIllustration(node.content, [], ctx);
    if (entry) return { nodeId: node.id, entries: [entry], success: true };
    return { nodeId: node.id, entries: [], success: false, error: 'No illustration result' };
  } catch (err) {
    return failResult(node, err);
  }
}

async function dispatchRich(
  node: IntentNode, gen: RichGenerator, ctx: string,
): Promise<NodeResult> {
  try {
    const entry = await gen(node.content, [], ctx);
    if (entry) return { nodeId: node.id, entries: [entry], success: true };
    return { nodeId: node.id, entries: [], success: false,
      error: `${node.action} generator returned null` };
  } catch (err) {
    return failResult(node, err);
  }
}

async function dispatchTutor(
  node: IntentNode, prompt: string, onChunk?: StreamChunkCallback,
): Promise<NodeResult> {
  const messages = [{ role: 'user' as const, parts: [{ text: prompt }] }];
  try {
    const result = onChunk
      ? await runTextAgentStreaming(TUTOR_AGENT, messages, onChunk)
      : await runTextAgent(TUTOR_AGENT, messages);
    const entry = parseTutorResponse(result.text);
    if (entry) return { nodeId: node.id, entries: [entry], success: true };
    return { nodeId: node.id,
      entries: [{ type: 'tutor-marginalia', content: result.text }], success: true };
  } catch (err) {
    return failResult(node, err);
  }
}

function failResult(node: IntentNode, err: unknown): NodeResult {
  const error = err instanceof Error ? err.message : String(err);
  console.error(`[DAG] Node ${node.id} (${node.action}) failed:`, error);
  return { nodeId: node.id, entries: [], success: false, error };
}

export function createDispatcher(notebookId?: string) {
  return (
    node: IntentNode, dag: IntentDAG,
    prior: Map<string, NodeResult>, onChunk?: StreamChunkCallback,
  ) => dispatchNode(node, dag, prior, onChunk, notebookId);
}
