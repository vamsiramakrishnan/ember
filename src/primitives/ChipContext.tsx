/**
 * ChipContext — optional context for enhanced chip rendering.
 *
 * When a ChipProvider wraps the component tree, MentionChip gains
 * the ability to resolve entity details on hover and show preview cards.
 * Without the provider, chips render in basic mode (no hover preview).
 *
 * This avoids coupling primitives to the persistence layer — the surface
 * (Notebook) provides the resolver, primitives consume it optionally.
 */
import { createContext, useContext } from 'react';
import type { EntityType } from '@/hooks/useEntityIndex';

export interface EntityPreview {
  name: string;
  entityType: EntityType;
  detail?: string;
  mastery?: { level: string; percentage: number };
  dates?: string;
  tradition?: string;
  crossReferences?: string[];
}

interface ChipContextValue {
  /** Resolve entity details for hover preview. Returns null if not found. */
  resolveEntity?: (entityType: EntityType, entityId: string) => EntityPreview | null;
}

const Ctx = createContext<ChipContextValue>({});

export const ChipProvider = Ctx.Provider;
export function useChipContext(): ChipContextValue { return useContext(Ctx); }
