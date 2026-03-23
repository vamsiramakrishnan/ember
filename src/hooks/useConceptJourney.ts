/**
 * useConceptJourney — trace how understanding of a concept
 * evolved through the student's exploration.
 *
 * This is the hook that powers the "How did I get here?" UX.
 * Given a concept name, it assembles a timeline:
 *
 * 1. First encounter (the entry that introduced it)
 * 2. Subsequent references (entries that explored it)
 * 3. Mastery changes (when understanding deepened or stalled)
 * 4. Related discoveries (thinkers, terms, texts connected to it)
 *
 * The journey is ordered chronologically, creating a narrative
 * of the student's intellectual path.
 */
import { Store, useStoreQuery } from '@/persistence';
import { useStudent } from '@/contexts/StudentContext';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { getIncoming, getOutgoing } from '@/persistence/repositories/graph';
import type { Relation } from '@/types/entity';
import type { MasteryRecord } from '@/persistence/records';

export interface JourneyMilestone {
  /** What happened at this point. */
  event: 'first-encounter' | 'exploration' | 'mastery-change' | 'connection-made' | 'question-asked';
  /** When it happened. */
  timestamp: number;
  /** The entry or entity involved. */
  entityId: string;
  entityKind: string;
  /** Human description. */
  description: string;
  /** Relation type that connects this to the concept. */
  relation: string;
}

export interface ConceptJourney {
  concept: string;
  conceptId: string;
  currentLevel: string;
  currentPercentage: number;
  milestones: JourneyMilestone[];
  /** How many entries reference this concept. */
  touchpoints: number;
  /** How many other entities connect to it. */
  connections: number;
}

export function useConceptJourney(conceptName: string) {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: journey, loading } = useStoreQuery<ConceptJourney | null>(
    Store.Relations,
    async () => {
      if (!nid || !conceptName) return null;

      const mastery = await getMasteryByNotebook(nid);
      const match = mastery.find((m) =>
        m.concept.toLowerCase() === conceptName.toLowerCase(),
      );
      if (!match) return null;

      const [incoming, outgoing] = await Promise.all([
        getIncoming(match.id),
        getOutgoing(match.id),
      ]);

      const allRelations = [...incoming, ...outgoing];
      const milestones = buildMilestones(match, allRelations);

      return {
        concept: match.concept,
        conceptId: match.id,
        currentLevel: match.level,
        currentPercentage: match.percentage,
        milestones: milestones.sort((a, b) => a.timestamp - b.timestamp),
        touchpoints: allRelations.filter(
          (r) => r.fromKind === 'entry' || r.toKind === 'entry',
        ).length,
        connections: allRelations.length,
      };
    },
    null,
    [nid, conceptName],
  );

  return { journey, loading };
}

function buildMilestones(
  concept: MasteryRecord,
  relations: Relation[],
): JourneyMilestone[] {
  const milestones: JourneyMilestone[] = [];

  // First encounter
  milestones.push({
    event: 'first-encounter',
    timestamp: concept.createdAt,
    entityId: concept.id,
    entityKind: 'concept',
    description: `First encountered "${concept.concept}"`,
    relation: 'introduces',
  });

  // Relations as milestones
  for (const r of relations) {
    const isIncoming = r.to === concept.id;
    const otherId = isIncoming ? r.from : r.to;
    const otherKind = isIncoming ? r.fromKind : r.toKind;

    let event: JourneyMilestone['event'] = 'connection-made';
    let description = '';

    switch (r.type) {
      case 'introduces':
        event = 'first-encounter';
        description = `Introduced via ${otherKind}`;
        break;
      case 'explores':
        event = 'exploration';
        description = `Explored in a ${otherKind}`;
        break;
      case 'references':
        event = 'connection-made';
        description = `Referenced by ${otherKind}`;
        break;
      case 'bridges-to':
        event = 'connection-made';
        description = `Bridge discovered to another concept`;
        break;
      default:
        description = `${r.type} relation with ${otherKind}`;
    }

    milestones.push({
      event,
      timestamp: r.createdAt,
      entityId: otherId,
      entityKind: otherKind,
      description,
      relation: r.type,
    });
  }

  return milestones;
}
