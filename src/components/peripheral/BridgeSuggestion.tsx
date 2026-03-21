/**
 * Bridge Suggestion (5.4)
 * Quiet suggestion that a new intellectual path has opened.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface BridgeSuggestionProps {
  children: string;
}

export function BridgeSuggestion({ children }: BridgeSuggestionProps) {
  return (
    <div
      style={{
        background: colors.sageDim,
        borderRadius: 2,
        padding: '14px 16px',
        marginBottom: 16,
      }}
    >
      <p
        style={{
          fontFamily: fontFamily.student,
          fontSize: '14px',
          fontWeight: 400,
          fontStyle: 'italic',
          color: colors.sage,
          lineHeight: 1.70,
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
