/**
 * DAG Dispatcher — routes each IntentNode to the appropriate agent.
 *
 * This is the bridge between the deterministic executor and the
 * non-deterministic agent calls. Each node's `action` field maps
 * to a specific agent configuration and prompt template.
 *
 * The dispatcher is stateless — it doesn't track what happened before.
 * Context from prior nodes is passed explicitly via `priorResults`.
 */
import type { IntentNode, IntentDAG } from './intent-dag';
import type { NodeResult } from './dag-executor';
import type { StreamChunkCallback } from './orchestrator';
import type { NotebookEntry } from '@/types/entries';
import { TUTOR_AGENT } from './agents';
import { runTextAgent, runTextAgentStreaming } from './run-agent';
import { parseTutorResponse } from './tutor-response-parser';
import { generateIllustration } from './enrichment';
import { setActivityDetail } from '@/state';

// ─── Activity labels for each action ───────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  respond: 'writing…',
  visualize: 'mapping concepts…',
  explain: 'preparing material…',
  illustrate: 'sketching…',
  research: 'researching…',
  define: 'defining…',
  connect: 'connecting ideas…',
  flashcards: 'creating study cards…',
  exercise: 'designing exercises…',
  quiz: 'preparing quiz…',
  summarize: 'summarizing…',
  timeline: 'building timeline…',
  teach: 'creating reading deck…',
  podcast: 'producing audio…',
  silence: '',
};

// ─── Context builder ────────────────────────────────────────

function buildContext(
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
): string {
  const parts: string[] = [];

  // Include results from dependency nodes
  for (const depId of node.dependsOn) {
    const depResult = priorResults.get(depId);
    const depNode = dag.nodes.find((n) => n.id === depId);
    if (depResult?.success && depNode) {
      const depContent = depResult.entries
        .filter((e): e is NotebookEntry & { content: string } => 'content' in e)
        .map((e) => e.content)
        .join('\n');
      if (depContent) {
        parts.push(`[Prior ${depNode.action}: ${depContent.slice(0, 500)}]`);
      }
    }
  }

  // Entity context
  if (node.entities.length > 0) {
    const entityList = node.entities
      .map((e) => `${e.name} (${e.entityType})`)
      .join(', ');
    parts.push(`[Referenced entities: ${entityList}]`);
  }

  return parts.join('\n');
}

// ─── Action → prompt mapping ────────────────────────────────

function buildPrompt(node: IntentNode, context: string): string {
  const base = node.content;

  switch (node.action) {
    case 'respond':
      return context ? `${context}\n\nStudent: ${base}` : base;

    case 'visualize':
      return `${context}\n\nCreate a concept diagram for: ${base}\n\nReturn a JSON concept-diagram with labeled nodes, sub-labels, and typed edges showing relationships. Use the graph layout with edge types (causes, enables, contrasts, extends, requires, bridges).`;

    case 'explain':
      return `${context}\n\nCreate structured reading material about: ${base}\n\nReturn a reading-material response with slides covering the key ideas.`;

    case 'research':
      return `${context}\n\nResearch in depth: ${base}\n\nUse search to find accurate, scholarly information. Return a thorough marginalia response.`;

    case 'define':
      return `${context}\n\nDefine and add to the student's lexicon: ${base}\n\nInclude etymology and usage context.`;

    case 'connect':
      return `${context}\n\nDraw a connection between: ${base}\n\nReturn a tutor-connection response showing how these ideas bridge. The first sentence should be emphasized (Medium weight).`;

    case 'flashcards':
      return `${context}\n\nCreate flashcards for active recall about: ${base}\n\nReturn a flashcard-deck with front/back pairs.`;

    case 'exercise':
      return `${context}\n\nDesign Socratic practice exercises about: ${base}\n\nReturn an exercise-set with open-response questions.`;

    case 'quiz':
      return `${context}\n\nTest the student's understanding of: ${base}\n\nReturn a Socratic question that probes deep understanding.`;

    case 'summarize':
      return `${context}\n\nDistill the key insights from the conversation about: ${base}`;

    case 'timeline':
      return `${context}\n\nCreate a historical timeline visualization for: ${base}`;

    case 'teach':
      return `${context}\n\nCreate a reading material deck teaching: ${base}`;

    case 'podcast':
      return `${context}\n\nProduce an audio discussion about: ${base}`;

    case 'illustrate':
      return `${context}\n\nCreate a hand-drawn sketch illustrating: ${base}`;

    default:
      return base;
  }
}

// ─── Dispatcher ─────────────────────────────────────────────

/**
 * Dispatch a single DAG node to the appropriate agent.
 * Returns typed NotebookEntry results.
 */
export async function dispatchNode(
  node: IntentNode,
  dag: IntentDAG,
  priorResults: Map<string, NodeResult>,
  onChunk?: StreamChunkCallback,
): Promise<NodeResult> {
  // Silence is a no-op
  if (node.action === 'silence') {
    return {
      nodeId: node.id,
      entries: [{ type: 'silence', text: undefined }],
      success: true,
    };
  }

  const context = buildContext(node, dag, priorResults);
  const prompt = buildPrompt(node, context);

  // Map DAG action to valid TutorActivityStep
  const stepMap: Record<string, string> = {
    respond: 'streaming', visualize: 'visualizing', explain: 'thinking',
    illustrate: 'illustrating', research: 'researching', define: 'thinking',
    connect: 'thinking', flashcards: 'thinking', exercise: 'thinking',
    quiz: 'thinking', summarize: 'thinking', timeline: 'visualizing',
    teach: 'thinking', podcast: 'thinking', silence: 'reflecting',
  };
  setActivityDetail({
    step: (stepMap[node.action] ?? 'thinking') as 'thinking',
    label: ACTIVITY_LABELS[node.action] ?? 'processing…',
  });

  // Illustrate requires the image agent, not the text agent.
  if (node.action === 'illustrate') {
    try {
      const entry = await generateIllustration(node.content);
      if (entry) {
        return { nodeId: node.id, entries: [entry], success: true };
      }
      return {
        nodeId: node.id,
        entries: [{ type: 'tutor-marginalia', content: 'The sketch could not be generated — try again with a more specific prompt.' }],
        success: false,
        error: 'Image generation returned no result',
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[DAG] Node ${node.id} (illustrate) failed:`, error);
      return { nodeId: node.id, entries: [], success: false, error };
    }
  }

  const messages = [{ role: 'user' as const, parts: [{ text: prompt }] }];

  try {
    let text: string;

    if (onChunk) {
      // Stream the response for the root node
      const result = await runTextAgentStreaming(TUTOR_AGENT, messages, onChunk);
      text = result.text;
    } else {
      const result = await runTextAgent(TUTOR_AGENT, messages);
      text = result.text;
    }

    const entry = parseTutorResponse(text);
    if (entry) {
      return { nodeId: node.id, entries: [entry], success: true };
    }

    // Fallback: wrap as marginalia
    return {
      nodeId: node.id,
      entries: [{ type: 'tutor-marginalia', content: text }],
      success: true,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[DAG] Node ${node.id} (${node.action}) failed:`, error);
    return { nodeId: node.id, entries: [], success: false, error };
  }
}
