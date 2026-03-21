/**
 * Union type for all notebook entry types.
 * Each variant maps to a component in the inventory (06-component-inventory.md).
 */

export interface DiagramNode {
  label: string;
  subLabel?: string;
}

export interface Thinker {
  name: string;
  dates: string;
  gift: string;
  bridge: string;
}

export type NotebookEntry =
  | { type: 'prose'; content: string }
  | { type: 'scratch'; content: string }
  | { type: 'hypothesis'; content: string }
  | { type: 'question'; content: string }
  | { type: 'tutor-marginalia'; content: string }
  | { type: 'tutor-question'; content: string }
  | { type: 'tutor-connection'; content: string; emphasisEnd: number }
  | { type: 'concept-diagram'; items: DiagramNode[] }
  | { type: 'thinker-card'; thinker: Thinker }
  | { type: 'silence'; text?: string }
  | { type: 'divider'; label?: string }
  | { type: 'echo'; content: string }
  | { type: 'bridge-suggestion'; content: string };
