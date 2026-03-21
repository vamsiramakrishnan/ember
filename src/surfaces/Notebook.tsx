/**
 * Notebook — Surface 1: The Desk
 * The active session. Today's thinking.
 * See: 04-information-architecture.md, Surface one.
 */
import { Column } from '@/primitives/Column';
import { SessionHeader } from '@/components/peripheral/SessionHeader';
import { useSessionEntries } from '@/hooks/useSessionEntries';
import { useRevealSequence } from '@/hooks/useRevealSequence';
import { NotebookEntryRenderer } from './NotebookEntryRenderer';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';
import { motion } from '@/tokens/motion';

const cursorKeyframes = `
@keyframes notebookCursor {
  0%, 100% { opacity: ${motion.cursorOpacityMax}; }
  50% { opacity: ${motion.cursorOpacityMin}; }
}
`;

export function Notebook() {
  const { entries, meta } = useSessionEntries();
  const { revealedCount, getEntryStyle } = useRevealSequence(entries.length);

  return (
    <Column>
      <SessionHeader
        sessionNumber={meta.sessionNumber}
        date={meta.date}
        timeOfDay={meta.timeOfDay}
        topic={meta.topic}
      />
      <div>
        {entries.map((entry, i) => (
          <div key={i} style={getEntryStyle(i)}>
            <NotebookEntryRenderer entry={entry} />
          </div>
        ))}
      </div>
      {revealedCount >= entries.length && (
        <div
          style={{
            paddingLeft: spacing.textIndent,
            paddingTop: 24,
            paddingBottom: 80,
          }}
        >
          <style>{cursorKeyframes}</style>
          <div
            style={{
              width: 1,
              height: 22,
              backgroundColor: colors.ink,
              animation: 'notebookCursor 1.2s ease infinite',
            }}
          />
          <p
            style={{
              fontFamily: fontFamily.student,
              fontSize: '14px',
              color: colors.inkGhost,
              marginTop: 16,
              fontStyle: 'italic',
            }}
          >
            Continue writing...
          </p>
        </div>
      )}
    </Column>
  );
}
