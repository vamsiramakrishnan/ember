/**
 * usePopupState — manages @ mention and / slash command popups.
 * Handles selection → text insertion into InputZone.
 * Handles navigation — clicking a mention navigates to the entity.
 * Supports "create new" — when @mentioning an unknown name, creates a stub
 * entity and triggers async enrichment via Gemini.
 */
import { useState, useCallback, useRef } from 'react';
import { useEntityIndex, type Entity } from './useEntityIndex';
import { useStudent } from '@/contexts/StudentContext';
import { createMentionSyntax } from '@/primitives/MentionChip';
import { createStub, enrichEntity, type EnrichmentResult } from '@/services/entity-enrichment';
import type { SlashCommand } from '@/components/student/SlashCommandPopup';
import type { Surface } from '@/layout/Navigation';

export function usePopupState(onNavigate?: (surface: Surface) => void) {
  const { search, registerEntries } = useEntityIndex();
  const { student, notebook } = useStudent();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<Entity[]>([]);
  const [pendingInsert, setPendingInsert] = useState<string | null>(null);
  const enrichingRef = useRef<Map<string, boolean>>(new Map());

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

    if (onNavigate) {
      if (entity.type === 'thinker' || entity.type === 'term' || entity.type === 'text') {
        onNavigate('constellation');
      }
    }
  }, [onNavigate]);

  /** Create a new entity from an unknown @mention name. */
  const handleMentionCreate = useCallback((name: string) => {
    const notebookId = notebook?.id;
    const studentId = student?.id;
    if (!notebookId || !studentId) return;

    // 1. Create stub entity immediately for optimistic UX
    const stub = createStub(name, notebookId);

    // 2. Insert mention syntax with stub ID (will be rewritten after enrichment)
    setPendingInsert(createMentionSyntax(name, stub.type, stub.id) + ' ');
    setMentionQuery(null);
    setMentionResults([]);

    // 3. Fire-and-forget enrichment — runs in background
    if (!enrichingRef.current.has(name.toLowerCase())) {
      enrichingRef.current.set(name.toLowerCase(), true);
      void enrichEntity(name, '', studentId, notebookId, notebook?.topic ?? '')
        .then((result: EnrichmentResult | null) => {
          enrichingRef.current.delete(name.toLowerCase());
          if (result) {
            console.info(`[Ember] Enriched @${name} → ${result.entity.type}: ${result.entity.name}`);
          }
        })
        .catch(() => {
          enrichingRef.current.delete(name.toLowerCase());
        });
    }
  }, [notebook, student]);

  /** Selected slash command — consumed by Notebook to route to an agent. */
  const [activeSlashCommand, setActiveSlashCommand] = useState<SlashCommand | null>(null);

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
    handleMentionCreate,
    handleSlashSelect,
    handleInsertConsumed,
    consumeSlashCommand,
    registerEntries,
  };
}
