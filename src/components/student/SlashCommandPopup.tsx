/**
 * SlashCommandPopup — appears when the student types / in the InputZone.
 * Grouped by category with accent-colored icons and keyboard hints.
 */
import { useState, useEffect, useRef } from 'react';
import styles from './MentionPopup.module.css';

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
  accent: string;
  group: string;
}

const s = (c: string | undefined) => c ?? '';

const COMMANDS: SlashCommand[] = [
  { id: 'explain', label: 'explain', hint: 'explain a concept in depth', icon: '◇', accent: s(styles.iconIndigo), group: 'explore' },
  { id: 'research', label: 'research', hint: 'deep-dive with search', icon: '◈', accent: s(styles.iconAmber), group: 'explore' },
  { id: 'define', label: 'define', hint: 'add a term to your lexicon', icon: '≡', accent: s(styles.iconSage), group: 'explore' },
  { id: 'visualize', label: 'visualize', hint: 'interactive concept diagram', icon: '◉', accent: s(styles.iconIndigo), group: 'create' },
  { id: 'draw', label: 'draw', hint: 'hand-drawn concept sketch', icon: '✎', accent: s(styles.iconMargin), group: 'create' },
  { id: 'timeline', label: 'timeline', hint: 'historical progression', icon: '→', accent: s(styles.iconAmber), group: 'create' },
  { id: 'connect', label: 'connect', hint: 'find bridges between ideas', icon: '⟷', accent: s(styles.iconSage), group: 'create' },
  { id: 'teach', label: 'teach', hint: 'create reading material deck', icon: '▣', accent: s(styles.iconAmber), group: 'create' },
  { id: 'quiz', label: 'quiz me', hint: 'test your understanding', icon: '?', accent: s(styles.iconDefault), group: 'reflect' },
  { id: 'summarize', label: 'summarize', hint: 'distill the session so far', icon: '≡', accent: s(styles.iconDefault), group: 'reflect' },
];

const GROUP_LABELS: Record<string, string> = {
  explore: 'explore', create: 'create', reflect: 'reflect',
};

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
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIdx]) {
        e.preventDefault();
        onSelect(filtered[selectedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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

  // Group commands by category (only when showing all)
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
            <button
              data-idx={i}
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
