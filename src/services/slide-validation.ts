/**
 * Slide Validation — shared validation + sanitisation for ReadingSlide data.
 * Used by both reading-material-gen and deck-expander to normalise AI output.
 */
import type { ReadingSlide } from '@/types/entries';

export const VALID_LAYOUTS = new Set([
  'title', 'content', 'two-column', 'quote', 'diagram', 'summary',
  'timeline', 'table', 'stat-cards', 'process-flow', 'pyramid',
  'comparison', 'funnel', 'cycle', 'checklist', 'matrix',
]);

export const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);

/** Sanitise and normalise raw AI slide output into typed ReadingSlide[]. */
export function validateSlides(raw: ReadingSlide[], max = 12): ReadingSlide[] {
  return raw.slice(0, max).map(sanitiseSlide);
}

function sanitiseSlide(s: ReadingSlide): ReadingSlide {
  const base: ReadingSlide = {
    heading: String(s.heading || 'Untitled'),
    body: String(s.body || ''),
    layout: VALID_LAYOUTS.has(s.layout) ? s.layout : 'content',
    accent: s.accent && VALID_ACCENTS.has(s.accent) ? s.accent : undefined,
    notes: s.notes ? String(s.notes) : undefined,
  };

  // Structured data — only include when relevant to the layout
  if (Array.isArray(s.timeline)) {
    base.timeline = s.timeline.map((t) => ({
      period: String(t.period ?? ''), event: String(t.event ?? ''),
      detail: t.detail ? String(t.detail) : undefined,
    }));
  }
  if (s.tableData?.headers) {
    base.tableData = {
      headers: s.tableData.headers.map(String),
      rows: (s.tableData.rows ?? []).map((r: string[]) => r.map(String)),
    };
  }
  if (Array.isArray(s.diagramItems)) {
    base.diagramItems = s.diagramItems.map((d) => ({
      label: String(d.label ?? ''), detail: d.detail ? String(d.detail) : undefined,
    }));
  }
  if (Array.isArray(s.statCards)) {
    base.statCards = s.statCards.map((c) => ({
      value: String(c.value ?? ''), label: String(c.label ?? ''),
      detail: c.detail ? String(c.detail) : undefined,
    }));
  }
  if (Array.isArray(s.processSteps)) {
    base.processSteps = s.processSteps.map((p) => ({
      step: String(p.step ?? ''), detail: p.detail ? String(p.detail) : undefined,
    }));
  }
  if (Array.isArray(s.pyramidLayers)) {
    base.pyramidLayers = s.pyramidLayers.map((l) => ({
      label: String(l.label ?? ''), detail: l.detail ? String(l.detail) : undefined,
    }));
  }
  if (s.comparisonData?.leftLabel) {
    base.comparisonData = {
      leftLabel: String(s.comparisonData.leftLabel),
      rightLabel: String(s.comparisonData.rightLabel ?? ''),
      leftPoints: (s.comparisonData.leftPoints ?? []).map(String),
      rightPoints: (s.comparisonData.rightPoints ?? []).map(String),
    };
  }
  if (Array.isArray(s.funnelStages)) {
    base.funnelStages = s.funnelStages.map((f) => ({
      stage: String(f.stage ?? ''), value: f.value ? String(f.value) : undefined,
      detail: f.detail ? String(f.detail) : undefined,
    }));
  }
  if (Array.isArray(s.cycleSteps)) {
    base.cycleSteps = s.cycleSteps.map((c) => ({
      step: String(c.step ?? ''), detail: c.detail ? String(c.detail) : undefined,
    }));
  }
  if (Array.isArray(s.checklistItems)) {
    base.checklistItems = s.checklistItems.map((c) => ({
      item: String(c.item ?? ''), checked: Boolean(c.checked),
    }));
  }
  if (s.matrixData?.quadrants) {
    base.matrixData = {
      topLabel: String(s.matrixData.topLabel ?? ''),
      bottomLabel: String(s.matrixData.bottomLabel ?? ''),
      leftLabel: String(s.matrixData.leftLabel ?? ''),
      rightLabel: String(s.matrixData.rightLabel ?? ''),
      quadrants: [
        String(s.matrixData.quadrants[0] ?? ''),
        String(s.matrixData.quadrants[1] ?? ''),
        String(s.matrixData.quadrants[2] ?? ''),
        String(s.matrixData.quadrants[3] ?? ''),
      ],
    };
  }

  return base;
}
