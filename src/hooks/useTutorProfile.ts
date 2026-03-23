/**
 * useTutorProfile — builds the student profile and notebook context
 * required by the orchestrator pipeline.
 *
 * Extracted from useGeminiTutor to enforce the 150-line file limit.
 */
import { useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { useSessionManager } from '@/hooks/useSessionManager';
import type { StudentProfile, NotebookContext } from '@/services/context-assembler';

export function useTutorProfile() {
  const { student, notebook } = useStudent();
  const { current } = useSessionManager();

  const buildProfile = useCallback(async (): Promise<StudentProfile | null> => {
    if (!student || !notebook) return null;
    const [mastery, lexicon, curiosities] = await Promise.all([
      getMasteryByNotebook(notebook.id),
      getLexiconByNotebook(notebook.id),
      getCuriositiesByNotebook(notebook.id),
    ]);
    return {
      name: student.displayName,
      masterySnapshot: mastery.map((m) => ({
        concept: m.concept, level: m.level, percentage: m.percentage,
      })),
      vocabularyCount: lexicon.length,
      activeCuriosities: curiosities.map((c) => c.question),
      totalMinutes: student.totalMinutes,
    };
  }, [student, notebook]);

  const buildNotebookCtx = useCallback(async (): Promise<NotebookContext | null> => {
    if (!notebook || !current) return null;
    const encounters = await getEncountersByNotebook(notebook.id);
    return {
      title: notebook.title,
      description: notebook.description,
      sessionNumber: current.number,
      sessionTopic: current.topic,
      thinkersMet: encounters.map((e) => e.thinker),
    };
  }, [notebook, current]);

  return { buildProfile, buildNotebookCtx, student, notebook, current };
}
