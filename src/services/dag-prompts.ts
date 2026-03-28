/** DAG prompt templates — maps each action to a formatted prompt string. */
import type { IntentNode } from './intent-dag';

export function buildPrompt(node: IntentNode, context: string): string {
  const base = node.content;
  switch (node.action) {
    case 'respond':
      return context ? `${context}\n\nStudent: ${base}` : base;
    case 'visualize':
      return `${context}\n\nCreate a concept diagram for: ${base}\n\nReturn a JSON concept-diagram with labeled nodes, sub-labels, and typed edges showing relationships. Use the graph layout with edge types (causes, enables, contrasts, extends, requires, bridges).`;
    case 'research':
      return `${context}\n\nResearch in depth: ${base}\n\nUse search to find accurate, scholarly information. Return a thorough marginalia response.`;
    case 'define':
      return `${context}\n\nDefine and add to the student's lexicon: ${base}\n\nInclude etymology and usage context.`;
    case 'connect':
      return `${context}\n\nDraw a connection between: ${base}\n\nReturn a tutor-connection response showing how these ideas bridge. The first sentence should be emphasized (Medium weight).`;
    case 'quiz':
      return `${context}\n\nTest the student's understanding of: ${base}\n\nReturn a Socratic question that probes deep understanding.`;
    case 'summarize':
      return `${context}\n\nDistill the key insights from the conversation about: ${base}`;
    case 'timeline':
      return `${context}\n\nCreate a historical timeline visualization for: ${base}`;
    case 'podcast':
      return `${context}\n\nProduce an audio discussion about: ${base}`;
    case 'illustrate':
      return `${context}\n\nCreate a hand-drawn sketch illustrating: ${base}`;
    default:
      return base;
  }
}
