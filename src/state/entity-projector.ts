/**
 * EntityProjector — projects notebook entries into knowledge graph entities.
 *
 * Replaces constellation-projection.ts with a unified, atomic approach:
 * - Each projection rule is a pure function: LiveEntry → EntityCommand[]
 * - Commands are atomic: CreateEntity, CreateRelation, UpdateEntity
 * - No if-then-else chains — a registry of typed projectors
 * - Every entity created is linked to its source entry via a relation
 *
 * The projector does not write to IndexedDB directly. It returns
 * commands that the caller applies. This keeps it pure and testable.
 */
import type { LiveEntry, NotebookEntry } from '@/types/entries';
import type {
  EntityKind,
  RelationType,
  MasteryLevel,
} from '@/types/entity';

// ─── Command types ────────────────────────────────────────

export interface CreateEntityCommand {
  action: 'create-entity';
  kind: EntityKind;
  data: Record<string, unknown>;
  /** The source entry that triggered this creation. */
  sourceEntryId: string;
  /** Relation type from entry to new entity. */
  relationToSource: RelationType;
}

export interface CreateRelationCommand {
  action: 'create-relation';
  fromId: string;
  toId: string;
  fromKind: EntityKind;
  toKind: EntityKind;
  type: RelationType;
  meta?: string;
  weight: number;
}

export interface UpdateEntityCommand {
  action: 'update-entity';
  entityId: string;
  kind: EntityKind;
  updates: Record<string, unknown>;
}

export type ProjectionCommand =
  | CreateEntityCommand
  | CreateRelationCommand
  | UpdateEntityCommand;

// ─── Projector registry ───────────────────────────────────

type Projector = (entry: LiveEntry) => ProjectionCommand[];

const projectors = new Map<NotebookEntry['type'], Projector>();

/** Register a projector for an entry type. */
function register(type: NotebookEntry['type'], fn: Projector) {
  projectors.set(type, fn);
}

// ─── Thinker card → ThinkerEntity ─────────────────────────

register('thinker-card', (le) => {
  const entry = le.entry;
  if (entry.type !== 'thinker-card') return [];

  return [{
    action: 'create-entity',
    kind: 'thinker',
    data: {
      name: entry.thinker.name,
      dates: entry.thinker.dates,
      tradition: '',
      gift: entry.thinker.gift,
      status: 'active',
    },
    sourceEntryId: le.id,
    relationToSource: 'introduces',
  }];
});

// ─── Concept diagram → ConceptEntity[] ────────────────────

register('concept-diagram', (le) => {
  const entry = le.entry;
  if (entry.type !== 'concept-diagram') return [];

  return entry.items.map((item) => ({
    action: 'create-entity' as const,
    kind: 'concept' as const,
    data: {
      term: item.label,
      mastery: 15,
      masteryLevel: 'exploring' as MasteryLevel,
    },
    sourceEntryId: le.id,
    relationToSource: 'explores' as RelationType,
  }));
});

// ─── Bridge suggestion → CuriosityEntity ──────────────────

register('bridge-suggestion', (le) => {
  const entry = le.entry;
  if (entry.type !== 'bridge-suggestion') return [];

  return [{
    action: 'create-entity',
    kind: 'curiosity',
    data: {
      question: entry.content,
      resolved: false,
    },
    sourceEntryId: le.id,
    relationToSource: 'explores',
  }];
});

// ─── Student question → CuriosityEntity ───────────────────

register('question', (le) => {
  const entry = le.entry;
  if (entry.type !== 'question') return [];
  if (entry.content.length <= 20) return [];

  return [{
    action: 'create-entity',
    kind: 'curiosity',
    data: {
      question: entry.content,
      resolved: false,
    },
    sourceEntryId: le.id,
    relationToSource: 'explores',
  }];
});

// ─── Tutor connection → ConceptEntity ─────────────────────

register('tutor-connection', (le) => {
  const entry = le.entry;
  if (entry.type !== 'tutor-connection') return [];
  if (entry.emphasisEnd <= 0) return [];

  const concept = entry.content.slice(0, entry.emphasisEnd).trim();
  if (concept.length <= 2 || concept.length >= 60) return [];

  return [{
    action: 'create-entity',
    kind: 'concept',
    data: {
      term: concept,
      mastery: 10,
      masteryLevel: 'exploring' as MasteryLevel,
    },
    sourceEntryId: le.id,
    relationToSource: 'explores',
  }];
});

// ─── Hypothesis → ConceptEntity[] ─────────────────────────

register('hypothesis', (le) => {
  const entry = le.entry;
  if (entry.type !== 'hypothesis') return [];

  return extractConcepts(entry.content).map((concept) => ({
    action: 'create-entity' as const,
    kind: 'concept' as const,
    data: {
      term: concept,
      mastery: 35,
      masteryLevel: 'developing' as MasteryLevel,
    },
    sourceEntryId: le.id,
    relationToSource: 'explores' as RelationType,
  }));
});

// ─── Reading material → ConceptEntity[] ──────────────────

register('reading-material', (le) => {
  const entry = le.entry;
  if (entry.type !== 'reading-material') return [];

  return entry.slides
    .filter((s) => s.layout !== 'title' && s.layout !== 'summary')
    .map((s) => ({
      action: 'create-entity' as const,
      kind: 'concept' as const,
      data: {
        term: s.heading,
        mastery: 15,
        masteryLevel: 'exploring' as MasteryLevel,
      },
      sourceEntryId: le.id,
      relationToSource: 'explores' as RelationType,
    }));
});

// ─── Flashcard deck → ConceptEntity[] ────────────────────

register('flashcard-deck', (le) => {
  const entry = le.entry;
  if (entry.type !== 'flashcard-deck') return [];

  return entry.cards
    .filter((c) => c.concept)
    .map((c) => ({
      action: 'create-entity' as const,
      kind: 'concept' as const,
      data: {
        term: c.concept!,
        mastery: 20,
        masteryLevel: 'exploring' as MasteryLevel,
      },
      sourceEntryId: le.id,
      relationToSource: 'explores' as RelationType,
    }));
});

// ─── Exercise set → ConceptEntity[] ──────────────────────

register('exercise-set', (le) => {
  const entry = le.entry;
  if (entry.type !== 'exercise-set') return [];

  return entry.exercises
    .filter((e) => e.concept)
    .map((e) => ({
      action: 'create-entity' as const,
      kind: 'concept' as const,
      data: {
        term: e.concept!,
        mastery: 30,
        masteryLevel: 'developing' as MasteryLevel,
      },
      sourceEntryId: le.id,
      relationToSource: 'explores' as RelationType,
    }));
});

// ─── Public API ───────────────────────────────────────────

/** Project a single entry into entity commands. */
export function projectEntry(le: LiveEntry): ProjectionCommand[] {
  const projector = projectors.get(le.entry.type);
  return projector ? projector(le) : [];
}

/** Project multiple entries, deduplicating by entity identity. */
export function projectEntries(
  entries: LiveEntry[],
): ProjectionCommand[] {
  const commands: ProjectionCommand[] = [];
  const seen = new Set<string>();

  for (const le of entries) {
    for (const cmd of projectEntry(le)) {
      if (cmd.action !== 'create-entity') {
        commands.push(cmd);
        continue;
      }

      // Deduplicate entities by kind + identity field
      const identity = entityIdentity(cmd);
      if (seen.has(identity)) continue;
      seen.add(identity);
      commands.push(cmd);
    }
  }

  return commands;
}

// ─── Helpers ──────────────────────────────────────────────

function entityIdentity(cmd: CreateEntityCommand): string {
  const d = cmd.data;
  switch (cmd.kind) {
    case 'thinker':
      return `thinker:${String(d.name).toLowerCase()}`;
    case 'concept':
      return `concept:${String(d.term).toLowerCase()}`;
    case 'curiosity':
      return `curiosity:${String(d.question).slice(0, 50)}`;
    case 'term':
      return `term:${String(d.term).toLowerCase()}`;
    default:
      return `${cmd.kind}:${cmd.sourceEntryId}`;
  }
}

function extractConcepts(text: string): string[] {
  const capitalized = text.match(
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  ) ?? [];

  const quoted = text.match(/"([^"]{3,40})"/g) ?? [];
  const quotedTerms = quoted.map((q) => q.slice(1, -1));

  return [...capitalized, ...quotedTerms]
    .filter((t) => t.length > 2 && t.length < 60)
    .slice(0, 3);
}
