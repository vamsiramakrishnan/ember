/**
 * Concept Diagram (2.4)
 * Visual representation of relationships between ideas.
 * Nodes with arrows, sketched-on-paper feeling.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';
import type { DiagramNode } from '@/types/entries';

interface ConceptDiagramProps {
  items: DiagramNode[];
}

export function ConceptDiagram({ items }: ConceptDiagramProps) {
  return (
    <div
      style={{
        borderTop: `1px solid ${colors.rule}`,
        borderBottom: `1px solid ${colors.rule}`,
        padding: '20px 0',
        marginBottom: spacing.diagramGap,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {items.map((node, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && (
              <span
                style={{
                  fontFamily: fontFamily.tutor,
                  fontSize: '20px',
                  color: colors.inkGhost,
                }}
              >
                →
              </span>
            )}
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <div
                style={{
                  fontFamily: fontFamily.tutor,
                  fontSize: '16px',
                  fontWeight: 500,
                  color: colors.ink,
                }}
              >
                {node.label}
              </div>
              {node.subLabel && (
                <div
                  style={{
                    fontFamily: fontFamily.system,
                    fontSize: '10px',
                    fontWeight: 300,
                    color: colors.inkFaint,
                    marginTop: 2,
                  }}
                >
                  {node.subLabel}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
