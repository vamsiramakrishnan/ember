/**
 * Card (3.2)
 * Self-contained unit of information. The LEGO brick.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

type AccentColor = 'margin' | 'sage' | 'indigo' | 'amber';

interface CardProps {
  title?: string;
  body: string;
  source?: string;
  accent?: AccentColor;
}

const accentColors: Record<AccentColor, string> = {
  margin: colors.margin,
  sage: colors.sage,
  indigo: colors.indigo,
  amber: colors.amber,
};

export function Card({ title, body, source, accent }: CardProps) {
  return (
    <div
      style={{
        background: colors.paperDeep,
        border: `1px solid ${colors.rule}`,
        borderRadius: 2,
        borderTop: accent
          ? `2px solid ${accentColors[accent]}`
          : `1px solid ${colors.rule}`,
        padding: '14px 16px',
        maxWidth: 280,
        marginBottom: 16,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: fontFamily.tutor,
            fontSize: '14px',
            fontWeight: 500,
            color: colors.ink,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontFamily: fontFamily.student,
          fontSize: '14px',
          fontWeight: 400,
          color: colors.inkSoft,
          lineHeight: 1.65,
        }}
      >
        {body}
      </div>
      {source && (
        <div
          style={{
            fontFamily: fontFamily.system,
            fontSize: '10px',
            fontWeight: 300,
            color: colors.inkGhost,
            marginTop: 8,
          }}
        >
          {source}
        </div>
      )}
    </div>
  );
}
