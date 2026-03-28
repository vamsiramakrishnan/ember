/**
 * DOCX Constants — shared color tokens and helpers for DOCX export.
 * Extracted to break the circular dependency between docx-export and docx-visual-aids.
 */

export const DOCX_COLORS = {
  ink: '2C2825', inkSoft: '5C5550', inkFaint: '9B9590',
  paper: 'F6F1EA', sage: '6B8F71', indigo: '5B6B8A',
  amber: 'C49A3C', margin: 'B8564F', rule: 'DDD6CC',
};

export function stripMd(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1').replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^[-*+]\s+/gm, '• ')
    .trim();
}
