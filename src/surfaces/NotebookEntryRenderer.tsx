/**
 * NotebookEntryRenderer — renders a single NotebookEntry by type.
 * Pure mapping component, no state. Delegates to the component inventory.
 */
import type { NotebookEntry } from '@/types/entries';
import { ProseEntry } from '@/components/student/ProseEntry';
import { ScratchNote } from '@/components/student/ScratchNote';
import { HypothesisMarker } from '@/components/student/HypothesisMarker';
import { QuestionBubble } from '@/components/student/QuestionBubble';
import { SketchEntry } from '@/components/student/SketchEntry';
import { Marginalia } from '@/components/tutor/Marginalia';
import { SocraticQuestion } from '@/components/tutor/SocraticQuestion';
import { Connection } from '@/components/tutor/Connection';
import { ConceptDiagram } from '@/components/tutor/ConceptDiagram';
import { ThinkerCard } from '@/components/tutor/ThinkerCard';
import { SilenceMarker } from '@/components/tutor/SilenceMarker';
import { Divider } from '@/components/student/Divider';
import { Echo } from '@/components/ambient/Echo';
import { BridgeSuggestion } from '@/components/peripheral/BridgeSuggestion';
import { Visualization } from '@/components/tutor/Visualization';
import { Illustration } from '@/components/tutor/Illustration';

interface Props {
  entry: NotebookEntry;
}

export function NotebookEntryRenderer({ entry }: Props) {
  switch (entry.type) {
    case 'prose':
      return <ProseEntry>{entry.content}</ProseEntry>;
    case 'scratch':
      return <ScratchNote>{entry.content}</ScratchNote>;
    case 'hypothesis':
      return <HypothesisMarker>{entry.content}</HypothesisMarker>;
    case 'question':
      return <QuestionBubble>{entry.content}</QuestionBubble>;
    case 'sketch':
      return <SketchEntry dataUrl={entry.dataUrl} />;
    case 'tutor-marginalia':
      return <Marginalia>{entry.content}</Marginalia>;
    case 'tutor-question':
      return <SocraticQuestion>{entry.content}</SocraticQuestion>;
    case 'tutor-connection':
      return (
        <Connection emphasisEnd={entry.emphasisEnd}>
          {entry.content}
        </Connection>
      );
    case 'concept-diagram':
      return <ConceptDiagram items={entry.items} />;
    case 'thinker-card':
      return <ThinkerCard thinker={entry.thinker} />;
    case 'silence':
      return <SilenceMarker text={entry.text} />;
    case 'divider':
      return <Divider label={entry.label} />;
    case 'echo':
      return <Echo>{entry.content}</Echo>;
    case 'bridge-suggestion':
      return <BridgeSuggestion>{entry.content}</BridgeSuggestion>;
    case 'visualization':
      return <Visualization html={entry.html} caption={entry.caption} />;
    case 'illustration':
      return <Illustration dataUrl={entry.dataUrl} caption={entry.caption} />;
  }
}
