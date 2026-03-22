/**
 * usePopupState — manages @ mention and / slash command popup state.
 * Connects InputZone triggers to MentionPopup and SlashCommandPopup.
 */
import { useState, useCallback } from 'react';
import { useEntityIndex, type Entity } from './useEntityIndex';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';

export interface PopupState {
  mentionQuery: string | null;
  slashQuery: string | null;
  mentionResults: Entity[];
}

export function usePopupState() {
  const { search } = useEntityIndex();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Entity[]>([]);

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

  const handleMentionSelect = useCallback((entity: Entity): string => {
    setMentionQuery(null);
    setMentionResults([]);
    return `@${entity.name}`;
  }, []);

  const handleSlashSelect = useCallback((command: SlashCommand): string => {
    setSlashQuery(null);
    return `/${command.label} `;
  }, []);

  return {
    mentionQuery,
    slashQuery,
    mentionResults,
    handleMentionTrigger,
    handleSlashTrigger,
    handlePopupClose,
    handleMentionSelect,
    handleSlashSelect,
  };
}
