/**
 * usePopupState — manages @ mention and / slash command popups.
 * Handles selection → text insertion into InputZone.
 * Handles navigation — clicking a mention navigates to the entity.
 */
import { useState, useCallback } from 'react';
import { useEntityIndex, type Entity } from './useEntityIndex';
import { createMentionSyntax } from '@/primitives/MentionChip';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';
import type { Surface } from '@/layout/Navigation';

export function usePopupState(onNavigate?: (surface: Surface) => void) {
  const { search } = useEntityIndex();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Entity[]>([]);
  const [pendingInsert, setPendingInsert] = useState<string | null>(null);

  const handleMentionTrigger = useCallback((query: string) => {
    setMentionQuery(query);
    setSlashQuery(null);
    setMentionResults(search(query).slice(0, 8));
  }, [search]);

  const handleSlashTrigger = useCallback((query: string) => {
    setSlashQuery(query);
    setMentionQuery(null);
  }, []);

  const handlePopupClose = useCallback(() => {
    setMentionQuery(null);
    setSlashQuery(null);
    setMentionResults([]);
  }, []);

  /** When user clicks a mention result: insert @[Name](type:id) and navigate */
  const handleMentionSelect = useCallback((entity: Entity) => {
    setPendingInsert(createMentionSyntax(entity.name, entity.type, entity.id) + ' ');
    setMentionQuery(null);
    setMentionResults([]);

    // Navigate to the entity's surface
    if (onNavigate) {
      if (entity.type === 'thinker' || entity.type === 'term' || entity.type === 'text') {
        onNavigate('constellation');
      }
    }
  }, [onNavigate]);

  /** Selected slash command — consumed by Notebook to route to an agent. */
  const [activeSlashCommand, setActiveSlashCommand] = useState<SlashCommand | null>(null);

  /** When user clicks a slash command: insert /command and store for routing. */
  const handleSlashSelect = useCallback((command: SlashCommand) => {
    setPendingInsert(`/${command.label} `);
    setSlashQuery(null);
    setActiveSlashCommand(command);
  }, []);

  const consumeSlashCommand = useCallback(() => {
    const cmd = activeSlashCommand;
    setActiveSlashCommand(null);
    return cmd;
  }, [activeSlashCommand]);

  const handleInsertConsumed = useCallback(() => {
    setPendingInsert(null);
  }, []);

  return {
    mentionQuery,
    slashQuery,
    mentionResults,
    pendingInsert,
    activeSlashCommand,
    handleMentionTrigger,
    handleSlashTrigger,
    handlePopupClose,
    handleMentionSelect,
    handleSlashSelect,
    handleInsertConsumed,
    consumeSlashCommand,
  };
}
