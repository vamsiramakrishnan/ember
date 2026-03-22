/**
 * SlashCommandPopup — appears when the student types / in the InputZone.
 * Provides quick actions: summarize, explain, visualize, research, etc.
 *
 * Commands invoke specific AI agent pipelines directly.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './MentionPopup.module.css'; // Shares styles with MentionPopup

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
}

const COMMANDS: SlashCommand[] = [
  { id: 'summarize', label: 'summarize', hint: 'summarize this session so far', icon: '≡' },
  { id: 'explain', label: 'explain', hint: 'explain a concept in depth', icon: '◇' },
  { id: 'visualize', label: 'visualize', hint: 'generate a concept diagram', icon: '◉' },
  { id: 'research', label: 'research', hint: 'deep-dive with Google Search', icon: '◈' },
  { id: 'connect', label: 'connect', hint: 'find bridges between ideas', icon: '⟷' },
  { id: 'quiz', label: 'quiz me', hint: 'test understanding with questions', icon: '?' },
  { id: 'timeline', label: 'timeline', hint: 'show historical progression', icon: '→' },
  { id: 'define', label: 'define', hint: 'add a term to your lexicon', icon: '▤' },
];

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
    ? COMMANDS.filter((c) => c.label.includes(query.toLowerCase()) || c.hint.includes(query.toLowerCase()))
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

  const handleClick = useCallback((cmd: SlashCommand) => {
    onSelect(cmd);
  }, [onSelect]);

  if (filtered.length === 0) {
    return (
      <div
        className={styles.popup}
        style={position ? { top: position.top, left: position.left } : undefined}
      >
        <div className={styles.empty}>no commands match</div>
      </div>
    );
  }

  return (
    <div
      className={styles.popup}
      style={position ? { top: position.top, left: position.left } : undefined}
      ref={menuRef}
      role="listbox"
      aria-label="Slash commands"
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.id}
          className={`${styles.item} ${i === selectedIdx ? styles.selected : ''}`}
          role="option"
          aria-selected={i === selectedIdx}
          onClick={() => handleClick(cmd)}
          onMouseEnter={() => setSelectedIdx(i)}
        >
          <span className={styles.icon}>{cmd.icon}</span>
          <div className={styles.content}>
            <span className={styles.name}>/{cmd.label}</span>
            <span className={styles.detail}>{cmd.hint}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
