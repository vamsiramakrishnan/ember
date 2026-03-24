/**
 * useMarginLayout — decides which tutor entries render in the right
 * margin vs inline. Short tutor-marginalia and tutor-connection entries
 * that follow a student entry are paired and moved to the margin.
 *
 * Returns the set of marginalized entry IDs and the pair metadata
 * so NotebookContent can render MarginNotes alongside student entries.
 */
import { useMemo, useState, useEffect } from 'react';
import type { LiveEntry } from '@/types/entries';

/** Character threshold — margin notes must be brief. */
const MARGIN_CHAR_LIMIT = 200;
/** Student entry must be substantial enough for a margin note to make sense. */
const MIN_STUDENT_LENGTH = 20;
/** Max consecutive margin notes before forcing inline (prevents margin overflow). */
const MAX_CONSECUTIVE_MARGIN = 3;
/** Sketch markers disqualify margin placement (need inline rendering). */
const SKETCH_RE = /\[sketch:/;

const MARGIN_TYPES = new Set(['tutor-marginalia', 'tutor-connection']);
const STUDENT_TYPES = new Set(['prose', 'question', 'hypothesis', 'scratch']);

export interface MarginPair {
  studentId: string;
  studentIndex: number;
  tutorId: string;
  tutorIndex: number;
  tutorContent: string;
  tutorType: string;
}

export interface MarginLayoutResult {
  pairs: MarginPair[];
  marginalized: Set<string>;
  isInMargin: (entryId: string) => boolean;
  pairForStudent: (studentId: string) => MarginPair | undefined;
}

export function useWideViewport(breakpoint = 900): boolean {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= breakpoint,
  );
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setWide(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return wide;
}

export function useMarginLayout(
  entries: LiveEntry[],
  enabled: boolean,
): MarginLayoutResult {
  return useMemo(() => {
    const empty: MarginLayoutResult = {
      pairs: [], marginalized: new Set(),
      isInMargin: () => false, pairForStudent: () => undefined,
    };
    if (!enabled || entries.length < 2) return empty;

    const pairs: MarginPair[] = [];
    const marginalized = new Set<string>();
    const byStudent = new Map<string, MarginPair>();
    let consecutiveMargin = 0;

    for (let i = 0; i < entries.length - 1; i++) {
      const student = entries[i];
      const tutor = entries[i + 1];
      if (!student || !tutor) { consecutiveMargin = 0; continue; }
      if (!STUDENT_TYPES.has(student.entry.type)) { consecutiveMargin = 0; continue; }
      if (!MARGIN_TYPES.has(tutor.entry.type)) { consecutiveMargin = 0; continue; }

      const studentContent = 'content' in student.entry
        ? (student.entry as { content: string }).content : '';
      const tutorContent = 'content' in tutor.entry
        ? (tutor.entry as { content: string }).content : '';

      // Skip if too short, too long, has sketches, or too many consecutive
      if (studentContent.length < MIN_STUDENT_LENGTH) { consecutiveMargin = 0; continue; }
      if (tutorContent.length > MARGIN_CHAR_LIMIT || tutorContent.length === 0) { consecutiveMargin = 0; continue; }
      if (SKETCH_RE.test(tutorContent)) { consecutiveMargin = 0; continue; }
      if (consecutiveMargin >= MAX_CONSECUTIVE_MARGIN) { consecutiveMargin = 0; continue; }

      const pair: MarginPair = {
        studentId: student.id, studentIndex: i,
        tutorId: tutor.id, tutorIndex: i + 1,
        tutorContent, tutorType: tutor.entry.type,
      };
      pairs.push(pair);
      marginalized.add(tutor.id);
      byStudent.set(student.id, pair);
      consecutiveMargin++;
      i++; // Skip the tutor entry in the next iteration
    }

    return {
      pairs, marginalized,
      isInMargin: (id: string) => marginalized.has(id),
      pairForStudent: (id: string) => byStudent.get(id),
    };
  }, [entries, enabled]);
}
