/**
 * Philosophy — Surface 3: The Star Chart
 * The design principles and intellectual foundation of Ember.
 * See: 04-information-architecture.md, Surface three.
 */
import { Column } from '@/primitives/Column';
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface Principle {
  numeral: string;
  title: string;
  body: string;
  provenance: string;
}

const principles: Principle[] = [
  {
    numeral: 'I',
    title: 'The tutor never answers first',
    body: 'The default interaction is the question, not the explanation. When a student asks something, the AI\'s first instinct is to ask the student what they think — as a genuine act of intellectual respect.',
    provenance: 'Feynman, on the primacy of the student\'s reasoning',
  },
  {
    numeral: 'II',
    title: 'Curiosity is the curriculum',
    body: 'The student\'s questions — not a committee\'s syllabus — determine what is explored. No two students traverse the same path through knowledge.',
    provenance: 'Hoel, on aristocratic tutoring',
  },
  {
    numeral: 'III',
    title: 'Mastery is invisible',
    body: 'Assessment is woven into the dialogue. The student experiences mastery not as a metric but as a feeling: the tutor starts asking harder questions.',
    provenance: 'Bloom, on mastery learning',
  },
  {
    numeral: 'IV',
    title: 'Every idea has a person',
    body: 'Knowledge is a tradition — a lineage of people who thought hard about the world. When a concept enters the student\'s world, it arrives with a person attached.',
    provenance: 'Darwin, Lovelace, Einstein — aristocratic tutoring',
  },
  {
    numeral: 'V',
    title: 'The interface is a notebook, not a chat',
    body: 'The student writes in the main column. The AI tutor\'s responses appear as marginalia. Time is measured in the rhythm of thought, not response latency.',
    provenance: 'Notion, on the blank page; Case, on calm technology',
  },
  {
    numeral: 'VI',
    title: 'Silence is a feature',
    body: 'When the AI asks a question, the screen goes quiet. There is no loading spinner. The system is not broken. It is waiting. It is holding space.',
    provenance: 'Feynman, on the gap between question and answer',
  },
];

function PrincipleBlock({ principle }: { principle: Principle }) {
  return (
    <div style={{ marginBottom: spacing.principleGap }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: fontFamily.tutor,
            fontSize: '20px',
            fontWeight: 300,
            color: colors.inkFaint,
          }}
        >
          {principle.numeral}.
        </span>
        <Text variant="sectionHeader" as="h3">
          {principle.title}
        </Text>
      </div>
      <p
        style={{
          fontFamily: fontFamily.student,
          fontSize: '16px',
          fontWeight: 400,
          color: colors.inkSoft,
          lineHeight: 1.75,
          paddingLeft: spacing.contentIndent,
          marginTop: 12,
          marginBottom: 8,
        }}
      >
        {principle.body}
      </p>
      <p
        style={{
          fontFamily: fontFamily.system,
          fontSize: '11px',
          fontWeight: 300,
          color: colors.inkGhost,
          letterSpacing: '1px',
          paddingLeft: spacing.contentIndent,
          margin: 0,
        }}
      >
        {principle.provenance}
      </p>
      <Rule margin={16} variant="ruleLight" />
    </div>
  );
}

export function Philosophy() {
  return (
    <Column>
      <div style={{ marginTop: spacing.sessionHeaderTop }}>
        <Text variant="pageTitle" as="h1" style={{ marginBottom: 16 }}>
          Philosophy
        </Text>
        <p
          style={{
            fontFamily: fontFamily.tutor,
            fontSize: '18px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: colors.inkSoft,
            lineHeight: 1.75,
            marginBottom: spacing.headerToContent,
          }}
        >
          What if every child had a tutor who followed their curiosity,
          knew them deeply, and never moved on until understanding was
          real?
        </p>

        {principles.map((p) => (
          <PrincipleBlock key={p.numeral} principle={p} />
        ))}

        <div style={{ height: 80 }} />
      </div>
    </Column>
  );
}
