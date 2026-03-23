/**
 * Context Assembler — builds a layered context window for the tutor agent.
 * Five layers: Profile, Notebook, Conversation, Semantic Memory, Research.
 * Each layer is tagged and budget-capped. See context-conversation.ts for
 * the conversation message builder.
 */
import type { LiveEntry } from '@/types/entries';
import type { AgentMessage } from './run-agent';
import { buildConversationMessages } from './context-conversation';

const LAYER_BUDGETS = {
  profile: 400,
  notebook: 200,
  memory: 2000,
  research: 1000,
  conversation: 2400,
} as const;

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n[...truncated]';
}

// ─── Layer types ─────────────────────────────────────────────────────

export interface StudentProfile {
  name: string;
  masterySnapshot: Array<{ concept: string; level: string; percentage: number }>;
  vocabularyCount: number;
  activeCuriosities: string[];
  totalMinutes: number;
}

export interface NotebookContext {
  title: string;
  description: string;
  sessionNumber: number;
  sessionTopic: string;
  thinkersMet: string[];
}

export interface SemanticMemory {
  relevantHistory: string | null;
  relevantVocabulary: string | null;
  relevantThinkers: string | null;
  citations: string[];
}

export interface ResearchContext {
  facts: string;
}

export interface AssembledContext {
  systemPreamble: string;
  messages: AgentMessage[];
}

// ─── Assembly ────────────────────────────────────────────────────────

/**
 * Assemble the full context window for the tutor.
 * Returns a system preamble (injected as early context) and
 * the conversation messages with the student's latest entry.
 */
export function assembleContext(opts: {
  studentText: string;
  entries: LiveEntry[];
  profile: StudentProfile | null;
  notebook: NotebookContext | null;
  memory: SemanticMemory | null;
  research: ResearchContext | null;
}): AssembledContext {
  const preambleParts: string[] = [];

  // Layer 1: Student Profile
  if (opts.profile) {
    preambleParts.push(truncateToTokens(buildProfileLayer(opts.profile), LAYER_BUDGETS.profile));
  }

  // Layer 2: Notebook Context
  if (opts.notebook) {
    preambleParts.push(truncateToTokens(buildNotebookLayer(opts.notebook), LAYER_BUDGETS.notebook));
  }

  // Layer 4: Semantic Memory (from File Search)
  if (opts.memory) {
    const memoryText = buildMemoryLayer(opts.memory);
    if (memoryText) preambleParts.push(truncateToTokens(memoryText, LAYER_BUDGETS.memory));
  }

  // Layer 5: Research
  if (opts.research) {
    preambleParts.push(truncateToTokens(buildResearchLayer(opts.research), LAYER_BUDGETS.research));
  }

  const systemPreamble = preambleParts.join('\n\n');

  // Layer 3: Conversation Window
  const messages = buildConversationMessages(
    opts.entries,
    opts.studentText,
    systemPreamble || undefined,
  );

  return { systemPreamble, messages };
}

// ─── Layer builders ──────────────────────────────────────────────────

function buildProfileLayer(p: StudentProfile): string {
  const masteryLines = p.masterySnapshot
    .slice(0, 8) // Top 8 concepts
    .map((m) => `  - ${m.concept}: ${m.level} (${m.percentage}%)`)
    .join('\n');

  const curiosityLines = p.activeCuriosities
    .slice(0, 4)
    .map((q) => `  - ${q}`)
    .join('\n');

  return `[STUDENT PROFILE — ${p.name}]
Time invested: ${Math.round(p.totalMinutes / 60)} hours
Vocabulary: ${p.vocabularyCount} terms
Concept mastery:
${masteryLines || '  (no mastery data yet)'}
Active questions:
${curiosityLines || '  (no open questions yet)'}`;
}

function buildNotebookLayer(n: NotebookContext): string {
  const thinkers = n.thinkersMet.length > 0
    ? `Thinkers encountered: ${n.thinkersMet.join(', ')}`
    : 'No thinker encounters yet.';

  return `[NOTEBOOK — "${n.title}"]
Guiding question: ${n.description}
Session ${n.sessionNumber}: ${n.sessionTopic}
${thinkers}`;
}

function buildMemoryLayer(m: SemanticMemory): string | null {
  const parts: string[] = [];

  if (m.relevantHistory) {
    parts.push(`[PAST SESSIONS — relevant context]\n${m.relevantHistory}`);
  }
  if (m.relevantVocabulary) {
    parts.push(`[VOCABULARY — terms the student knows]\n${m.relevantVocabulary}`);
  }
  if (m.relevantThinkers) {
    parts.push(`[THINKERS — past encounters]\n${m.relevantThinkers}`);
  }

  if (parts.length === 0) return null;

  let text = parts.join('\n\n');
  if (m.citations.length > 0) {
    text += `\n[Sources: ${m.citations.join(', ')}]`;
  }
  return text;
}

function buildResearchLayer(r: ResearchContext): string {
  return `[RESEARCH — verified facts]\n${r.facts}`;
}
