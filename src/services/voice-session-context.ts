/**
 * Voice Session Context — builds the startup context and tool declarations
 * for the Gemini Live API voice session.
 *
 * Two parts:
 * 1. System instruction context: compact snapshot of student state,
 *    seeded once at session start so the tutor knows who it's talking to
 * 2. Tool declarations: all discovery + creation tools the tutor needs
 *    to explore knowledge and update the notebook during conversation
 */
import { Behavior } from '@google/genai';
import type { LiveEntry } from '@/types/entries';
import { recentContext } from './entry-utils';
import type { StudentProfile, NotebookContext } from './context-assembler';
import { buildProfileLayer, buildNotebookLayer } from './context-layers';

// ─── Context Builder ────────────────────────────────────────

export interface VoiceContextInput {
  profile: StudentProfile | null;
  notebook: NotebookContext | null;
  entries: LiveEntry[];
  sessionTopic: string;
}

/**
 * Build the system instruction for the voice session.
 * Compact but rich — gives the tutor everything it needs to start
 * a meaningful conversation without tool calls.
 */
export function buildVoiceSystemInstruction(input: VoiceContextInput): string {
  const parts: string[] = [
    TUTOR_PERSONA,
    '',
    '── STUDENT CONTEXT ──',
  ];

  if (input.profile) {
    parts.push(buildProfileLayer(input.profile));
  }

  if (input.notebook) {
    parts.push(buildNotebookLayer(input.notebook));
  }

  // Recent conversation for continuity
  const recent = recentContext(input.entries, 8, 1200);
  if (recent) {
    parts.push(`[RECENT CONVERSATION]\n${recent}`);
  }

  parts.push('', '── TOOLS ──', TOOL_USAGE_INSTRUCTIONS);

  return parts.join('\n\n');
}

const TUTOR_PERSONA = `You are the tutor in Ember — a warm, patient, intellectually rigorous voice companion. You are speaking with a student in a live voice conversation. Your voice is Kore: measured, gentle, with brief pauses before key ideas.

YOUR APPROACH:
- Ask before you explain. Your default is the Socratic question.
- Follow the student's curiosity, not a syllabus.
- When you introduce a concept, ground it in a person (a thinker) and a story.
- Use tools silently to keep the notebook updated as you talk. The student will see entries appearing in their notebook in real-time.
- Keep responses conversational — 2-4 sentences per turn. This is a dialogue, not a lecture.
- When the student demonstrates understanding, update their mastery level.
- When you use a technical term for the first time, add it to their lexicon.`;

const TOOL_USAGE_INSTRUCTIONS = `You have access to tools that run in the background without interrupting the conversation.

CREATION TOOLS (use frequently — the notebook should fill as you talk):
- addNotebookEntry: Record key points, insights, your Socratic questions, connections between ideas
- addConceptDiagram: Create visual concept maps when explaining relationships
- addThinkerCard: Introduce a thinker with their gift to the student's understanding
- addVocabularyTerm: Define technical terms as you introduce them
- updateConceptMastery: Update when student demonstrates understanding or confusion

DISCOVERY TOOLS (use to inform your responses):
- searchHistory: Search the student's past sessions, vocabulary, encounters for relevant context
- lookupConcept: Check student's mastery before deciding how deep to go
- lookupThinker: Check if student has met a thinker before referencing them
- lookupTerm: Check if student knows a term before using it
- getConnections: Find what connects to a concept in the student's graph
- discoverGaps: Find what the student hasn't explored yet — guide them there

All tools are non-blocking. Call them as you speak — don't pause to wait for results.`;

// ─── Tool Declarations ──────────────────────────────────────

export const VOICE_TOOL_DECLARATIONS: Array<Record<string, unknown>> = [
  {
    functionDeclarations: [
      // ── Creation tools (NON_BLOCKING) ──
      {
        name: 'addNotebookEntry',
        description: 'Add an entry to the student notebook. Use this frequently to record key points, Socratic questions, connections, and insights as the conversation progresses. The student sees entries appear in real-time.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            entryType: {
              type: 'STRING',
              enum: ['tutor-marginalia', 'tutor-question', 'tutor-connection', 'prose'],
              description: 'marginalia = general insight, question = Socratic probe, connection = cross-domain link, prose = key student statement worth recording',
            },
            content: { type: 'STRING', description: 'The text content of the entry' },
          },
          required: ['entryType', 'content'],
        },
      },
      {
        name: 'addConceptDiagram',
        description: 'Create a concept diagram showing relationships between ideas. Use when explaining how concepts connect, processes flow, or hierarchies work.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Title of the diagram' },
            nodes: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  label: { type: 'STRING' },
                  detail: { type: 'STRING', description: 'Brief explanation of this concept' },
                },
                required: ['label'],
              },
            },
            edges: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  from: { type: 'NUMBER', description: 'Index of source node' },
                  to: { type: 'NUMBER', description: 'Index of target node' },
                  type: { type: 'STRING', enum: ['causes', 'enables', 'contrasts', 'extends', 'requires'] },
                  label: { type: 'STRING', description: 'Edge label (optional)' },
                },
                required: ['from', 'to', 'type'],
              },
            },
          },
          required: ['title', 'nodes'],
        },
      },
      {
        name: 'addThinkerCard',
        description: 'Introduce a thinker to the student. Creates a card with their name, dates, and their gift — the key idea they bring to this topic.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Thinker\'s full name' },
            dates: { type: 'STRING', description: 'Birth-death years, e.g. "1571–1630"' },
            tradition: { type: 'STRING', description: 'Their field or tradition' },
            gift: { type: 'STRING', description: 'One sentence: what they give the student' },
            bridge: { type: 'STRING', description: 'How this thinker connects to the current topic' },
          },
          required: ['name', 'gift'],
        },
      },
      {
        name: 'addVocabularyTerm',
        description: 'Add a new term to the student\'s personal lexicon. Call this whenever you introduce or define a technical term for the first time.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            term: { type: 'STRING' },
            definition: { type: 'STRING', description: 'Clear, student-accessible definition' },
            pronunciation: { type: 'STRING', description: 'IPA or phonetic pronunciation (optional)' },
            etymology: { type: 'STRING', description: 'Word origin and history (optional)' },
          },
          required: ['term', 'definition'],
        },
      },
      {
        name: 'updateConceptMastery',
        description: 'Update the student\'s mastery level for a concept based on what they demonstrated in conversation. Call when they show understanding (upgrade) or confusion (note as developing).',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            concept: { type: 'STRING' },
            level: { type: 'STRING', enum: ['exploring', 'developing', 'strong', 'mastered'] },
            reason: { type: 'STRING', description: 'Brief note on why this level (optional)' },
          },
          required: ['concept', 'level'],
        },
      },

      // ── Discovery tools (NON_BLOCKING) ──
      {
        name: 'searchHistory',
        description: 'Search the student\'s intellectual history — past sessions, vocabulary, thinker encounters, mastery data. Use to recall what they\'ve explored before.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'What to search for' },
            scope: {
              type: 'STRING',
              enum: ['all', 'notebook', 'sessions', 'lexicon', 'encounters', 'mastery'],
              description: 'Where to search. Default "all".',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'lookupConcept',
        description: 'Check the student\'s mastery of a specific concept. Returns their level and percentage. Use before deciding how deep to go on a topic.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            concept: { type: 'STRING' },
          },
          required: ['concept'],
        },
      },
      {
        name: 'lookupThinker',
        description: 'Check if the student has encountered a thinker before. Returns status (active/dormant/bridged), core idea, and when they first met.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            thinker: { type: 'STRING' },
          },
          required: ['thinker'],
        },
      },
      {
        name: 'lookupTerm',
        description: 'Check if the student knows a term. Returns their definition, mastery level, and etymology.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            term: { type: 'STRING' },
          },
          required: ['term'],
        },
      },
      {
        name: 'getConnections',
        description: 'Explore what connects to a concept in the student\'s knowledge graph. Returns neighboring concepts, thinkers, and terms.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            entity: { type: 'STRING', description: 'Concept, thinker, or term name' },
            depth: { type: 'NUMBER', description: 'Hops to traverse (1=direct, 2=second-order). Default 1.' },
          },
          required: ['entity'],
        },
      },
      {
        name: 'discoverGaps',
        description: 'Find learning gaps — concepts not yet developed, thinkers not yet explored, questions not yet resolved. Use to guide the conversation toward productive territory.',
        behavior: Behavior.NON_BLOCKING,
        parameters: {
          type: 'OBJECT',
          properties: {
            focus: {
              type: 'STRING',
              enum: ['mastery', 'thinkers', 'curiosities', 'all'],
              description: 'What kind of gaps. Default "all".',
            },
          },
        },
      },
    ],
  },
];
