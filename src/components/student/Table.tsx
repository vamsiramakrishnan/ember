/**
 * Table (3.3)
 * Structured comparison or collection.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface TableProps {
  headers: string[];
  rows: string[][];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div
      style={{
        border: `1px solid ${colors.rule}`,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 24,
        width: '100%',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: colors.paperDeep }}>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  fontFamily: fontFamily.tutor,
                  fontSize: '13px',
                  fontWeight: 500,
                  color: colors.ink,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '10px 12px',
                  textAlign: 'left',
                  borderBottom: `1px solid ${colors.rule}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    fontFamily: fontFamily.student,
                    fontSize: '14px',
                    fontWeight: 400,
                    color: colors.inkSoft,
                    padding: '10px 12px',
                    borderBottom:
                      ri < rows.length - 1
                        ? `1px solid ${colors.ruleLight}`
                        : 'none',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
