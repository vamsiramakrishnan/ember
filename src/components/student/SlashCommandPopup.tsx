/**
 * SlashCommandPopup — slash command palette triggered by typing / in the InputZone.
 * Post-spec extension: not in the original component inventory (06).
 * Related: 03-interaction-language.md, 05-ai-contract.md
 */
import { useState, useEffect, useRef } from 'react';
import { COMMANDS, GROUP_LABELS } from './slash-commands';
import type { SlashCommand } from './slash-commands';
import styles from './MentionPopup.module.css';

export type { SlashCommand };

interface SlashCommandPopupProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function SlashCommandPopup({
  query, onSelect, onClose, position,
}: SlashCommandPopupProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? COMMANDS.filter((c) =>
        c.label.includes(query.toLowerCase()) || c.hint.includes(query.toLowerCase()))
    : COMMANDS;

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

  const showGroups = !query.trim();
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
      {filtered.map((cmd, i) => {
        const groupHeader = showGroups && cmd.group !== lastGroup;
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
            </button>
          </div>
        );
      })}
      <div className={styles.footer}>
        <span className={styles.footerHint}>↑↓ navigate</span>
        <span className={styles.footerHint}>↵ select</span>
        <span className={styles.footerHint}>esc close</span>
      </div>
    </div>
  );
}
