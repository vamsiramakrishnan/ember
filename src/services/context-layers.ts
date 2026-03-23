/**
 * Context Layer Builders — format each context layer into tagged text
 * blocks for the tutor's system preamble.
 */
import type { StudentProfile, NotebookContext, SemanticMemory, ResearchContext } from './context-assembler';
import type { BackgroundResults } from './background-results';

export function buildProfileLayer(p: StudentProfile): string {
  const masteryLines = p.masterySnapshot
    .slice(0, 8)
    .map((m) => `  - ${m.concept}: ${m.level} (${m.percentage}%)`)
    .join('\n');

  const curiosityLines = p.activeCuriosities
    .slice(0, 4)
    .map((q) => `  - ${q}`)
    .join('\n');

  return `[STUDENT PROFILE — ${p.name}]
Time invested: ${Math.round(p.totalMinutes / 60)} hours
Vocabulary: ${p.vocabularyCount} terms
Concept mastery:
${masteryLines || '  (no mastery data yet)'}
Active questions:
${curiosityLines || '  (no open questions yet)'}`;
}

export function buildNotebookLayer(n: NotebookContext): string {
  const thinkers = n.thinkersMet.length > 0
    ? `Thinkers encountered: ${n.thinkersMet.join(', ')}`
    : 'No thinker encounters yet.';

  return `[NOTEBOOK — "${n.title}"]
Guiding question: ${n.description}
Session ${n.sessionNumber}: ${n.sessionTopic}
${thinkers}`;
}

export function buildMemoryLayer(m: SemanticMemory): string | null {
  const parts: string[] = [];

  if (m.relevantHistory) {
    parts.push(`[PAST SESSIONS — relevant context]\n${m.relevantHistory}`);
  }
  if (m.relevantVocabulary) {
    parts.push(`[VOCABULARY — terms the student knows]\n${m.relevantVocabulary}`);
  }
  if (m.relevantThinkers) {
    parts.push(`[THINKERS — past encounters]\n${m.relevantThinkers}`);
  }

  if (parts.length === 0) return null;

  let text = parts.join('\n\n');
  if (m.citations.length > 0) {
    text += `\n[Sources: ${m.citations.join(', ')}]`;
  }
  return text;
}

export function buildResearchLayer(r: ResearchContext): string {
  return `[RESEARCH — verified facts]\n${r.facts}`;
}

export function buildBackgroundResultsLayer(bg: BackgroundResults): string {
  const parts: string[] = ['[RECENT UPDATES — from your last response]'];
  if (bg.newThinkers.length > 0) {
    parts.push(`New thinkers discovered: ${bg.newThinkers.join(', ')}`);
  }
  if (bg.newTerms.length > 0) {
    parts.push(`New vocabulary: ${bg.newTerms.join(', ')}`);
  }
  if (bg.masteryChanges.length > 0) {
    parts.push(
      'Mastery changes: ' +
        bg.masteryChanges
          .map((c) => `${c.concept}: ${c.from}% → ${c.to}%`)
          .join(', '),
    );
  }
  return parts.join('\n');
}
