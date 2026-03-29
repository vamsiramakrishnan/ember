/**
 * SlashCommandPopup — composition-aware command palette.
 *
 * Smart behavior:
 *   - No context: show all commands grouped by role (investigate → format → workflow)
 *   - Action already in text: promote format verbs to top, show "→ format as…" header
 *   - Format already in text: promote action verbs to top
 *   - Typing query: filter across all commands
 *
 * Post-spec extension: not in the original component inventory (06).
 * Related: 03-interaction-language.md, 05-ai-contract.md
 */
import { useState, useEffect, useRef } from 'react';
import { COMMANDS, GROUP_LABELS, ACTION_VERB_IDS, OUTPUT_VERB_IDS } from './slash-commands';
import type { SlashCommand } from './slash-commands';
import styles from './MentionPopup.module.css';

export type { SlashCommand };

interface SlashCommandPopupProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
  /** Current text in the input — used to detect existing verbs for smart ordering. */
  currentText?: string;
}

/**
 * Detect which verb roles are already present in the input text.
 * Returns set of command IDs found.
 */
function detectExistingVerbs(text: string): Set<string> {
  const found = new Set<string>();
  for (const cmd of COMMANDS) {
    const re = new RegExp(`\\/${cmd.id}\\b`);
    if (re.test(text)) found.add(cmd.id);
  }
  return found;
}

/**
 * Smart-order commands based on composition context.
 * If user already has an action verb, promote format verbs.
 * If user already has a format verb, promote action verbs.
 */
function smartOrder(commands: SlashCommand[], currentText?: string): {
  commands: SlashCommand[];
  contextHint: string | null;
} {
  if (!currentText) return { commands, contextHint: null };

  const existing = detectExistingVerbs(currentText);
  if (existing.size === 0) return { commands, contextHint: null };

  const hasAction = [...existing].some((id) => ACTION_VERB_IDS.has(id));
  const hasFormat = [...existing].some((id) => OUTPUT_VERB_IDS.has(id));

  if (hasAction && !hasFormat) {
    // Promote format verbs — user picked an action, now suggest output
    const formats = commands.filter((c) => c.role === 'format');
    const rest = commands.filter((c) => c.role !== 'format');
    return {
      commands: [...formats, ...rest],
      contextHint: '→ format as…',
    };
  }

  if (hasFormat && !hasAction) {
    // Promote action verbs — user picked a format, now suggest input
    const actions = commands.filter((c) => c.role === 'action');
    const rest = commands.filter((c) => c.role !== 'action');
    return {
      commands: [...actions, ...rest],
      contextHint: '← investigate with…',
    };
  }

  return { commands, contextHint: null };
}

export function SlashCommandPopup({
  query, onSelect, onClose, position, currentText,
}: SlashCommandPopupProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const isFiltering = query.trim().length > 0;
  const baseFiltered = isFiltering
    ? COMMANDS.filter((c) =>
        c.label.includes(query.toLowerCase()) || c.hint.includes(query.toLowerCase()))
    : COMMANDS;

  // Apply smart ordering when not filtering
  const { commands: filtered, contextHint } = isFiltering
    ? { commands: baseFiltered, contextHint: null }
    : smartOrder(baseFiltered, currentText);

  useEffect(() => setSelectedIdx(0), [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIdx]) {
        e.preventDefault(); e.stopPropagation();
        onSelect(filtered[selectedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [filtered, selectedIdx, onSelect, onClose]);

  const posStyle = position ? { top: position.top, left: position.left } : undefined;

  if (filtered.length === 0) {
    return (
      <div className={styles.popup} style={posStyle}>
        <div className={styles.queryBar}>
          <span className={styles.queryPrefix}>/</span>
          <span className={styles.queryText}>{query}</span>
        </div>
        <div className={styles.empty}>no commands match</div>
      </div>
    );
  }

  const showGroups = !isFiltering;
  let lastGroup = '';

  return (
    <div className={styles.popup} style={posStyle} ref={menuRef}
      role="listbox" aria-label="Slash commands">
      {query && (
        <div className={styles.queryBar}>
          <span className={styles.queryPrefix}>/</span>
          <span className={styles.queryText}>{query}</span>
        </div>
      )}
      {contextHint && (
        <div className={styles.sectionHeader}>{contextHint}</div>
      )}
      {filtered.map((cmd, i) => {
        const groupHeader = showGroups && !contextHint && cmd.group !== lastGroup;
        lastGroup = cmd.group;
        return (
          <div key={cmd.id}>
            {groupHeader && (
              <div className={styles.sectionHeader}>
                {GROUP_LABELS[cmd.group] ?? cmd.group}
              </div>
            )}
            <button data-idx={i}
              className={`${styles.item} ${i === selectedIdx ? styles.selected : ''}`}
              role="option" aria-selected={i === selectedIdx}
              onClick={() => onSelect(cmd)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className={`${styles.icon} ${cmd.accent}`}>{cmd.icon}</span>
              <div className={styles.content}>
                <span className={styles.name}>/{cmd.label}</span>
                <span className={styles.detail}>{cmd.hint}</span>
              </div>
              {cmd.role === 'workflow' && cmd.expandsTo && (
                <span className={styles.expandHint}>
                  {cmd.expandsTo.length} steps
                </span>
              )}
            </button>
          </div>
        );
      })}
      <div className={styles.footer}>
        <span className={styles.footerHint}>↑↓ navigate</span>
        <span className={styles.footerHint}>↵ select</span>
        <span className={styles.footerHint}>combine: /action topic /format</span>
      </div>
    </div>
  );
}
