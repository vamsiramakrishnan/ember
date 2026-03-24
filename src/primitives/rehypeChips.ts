/**
 * rehypeChips — rehype plugin that transforms @mentions and /commands
 * in text nodes into custom hast elements (mention-chip, slash-chip).
 * Replaces the old regex-based ChipAwareContent with a proper AST pass
 * in the unified pipeline. One parse, one walk, everything composes.
 */
import type { Root, Element, Text, RootContent } from 'hast';

type AnyContent = RootContent;
type HasChildren = { children: AnyContent[] };

const MENTION_SRC = '@\\[([^\\]]+)\\]\\(([^:]+):([^)]+)\\)';
const SLASH_SRC =
  '(?:^|\\s)(\\/(?:draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise))(?=\\s|[.,;:!?]|$)';

const COMBINED = new RegExp(`${MENTION_SRC}|${SLASH_SRC}`, 'g');

export function rehypeChips() {
  return (tree: Root) => { walkChildren(tree as HasChildren); };
}

/** Recurse through all nodes, splitting text nodes that contain chips. */
function walkChildren(node: HasChildren) {
  const next: AnyContent[] = [];
  let changed = false;

  for (const child of node.children) {
    if (child.type === 'text') {
      const parts = splitChips(child.value);
      if (parts.length === 1 && parts[0]?.type === 'text') {
        next.push(child);
      } else {
        next.push(...(parts as AnyContent[]));
        changed = true;
      }
    } else {
      if ('children' in child) walkChildren(child as HasChildren);
      next.push(child);
    }
  }

  if (changed) node.children = next;
}

/** Split a text string into interleaved text nodes and chip elements. */
function splitChips(text: string): AnyContent[] {
  const parts: AnyContent[] = [];
  COMBINED.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = COMBINED.exec(text)) !== null) {
    if (m[1] != null && m[2] != null && m[3] != null) {
      // @[name](type:id)
      if (m.index > last) parts.push(txt(text.slice(last, m.index)));
      parts.push(mention(m[1], m[2], m[3]));
      last = m.index + m[0].length;
    } else if (m[4] != null) {
      // /command — may include leading whitespace in m[0]
      const cmd = m[4];
      const cmdStart = m.index + m[0].indexOf('/');
      if (cmdStart > last) parts.push(txt(text.slice(last, cmdStart)));
      parts.push(slash(cmd.replace(/^\//, '')));
      last = cmdStart + cmd.length;
    }
  }

  if (last < text.length) parts.push(txt(text.slice(last)));
  if (parts.length === 0) parts.push(txt(text));
  return parts;
}

function txt(value: string): Text {
  return { type: 'text', value };
}

function mention(name: string, entityType: string, entityId: string): Element {
  return {
    type: 'element',
    tagName: 'mention-chip',
    properties: { name, entityType, entityId },
    children: [],
  };
}

function slash(command: string): Element {
  return {
    type: 'element',
    tagName: 'slash-chip',
    properties: { command },
    children: [],
  };
}
