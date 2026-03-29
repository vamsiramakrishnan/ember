/**
 * NotebookEntryRenderer — renders a single NotebookEntry by type.
 * Pure mapping component, no state. Delegates to the component inventory.
 *
 * Covers all block types: student, tutor, rich content, AI-generated, system.
 */
import { useCallback } from 'react';
import { useEntityNavigation } from '@/hooks/useEntityNavigation';
import type { NotebookEntry } from '@/types/entries';
import { ProseEntry } from '@/components/student/ProseEntry';
import { ScratchNote } from '@/components/student/ScratchNote';
import { HypothesisMarker } from '@/components/student/HypothesisMarker';
import { QuestionBubble } from '@/components/student/QuestionBubble';
import { SketchEntry } from '@/components/student/SketchEntry';
import { CodeCell } from '@/components/student/CodeCell';
import { ImageEntry } from '@/components/student/ImageEntry';
import { FileUploadEntry } from '@/components/student/FileUploadEntry';
import { EmbedEntry } from '@/components/student/EmbedEntry';
import { DocumentEntry } from '@/components/student/DocumentEntry';
import { Marginalia } from '@/components/tutor/Marginalia';
import { SocraticQuestion } from '@/components/tutor/SocraticQuestion';
import { Connection } from '@/components/tutor/Connection';
import { ConceptDiagram } from '@/components/tutor/ConceptDiagram';
import { ThinkerCard } from '@/components/tutor/ThinkerCard';
import { SilenceMarker } from '@/components/tutor/SilenceMarker';
import { Divider } from '@/components/student/Divider';
import { Echo } from '@/components/ambient/Echo';
import { BridgeSuggestion } from '@/components/peripheral/BridgeSuggestion';
import { PodcastPlayer } from '@/components/tutor/PodcastPlayer';
import { Visualization } from '@/components/tutor/Visualization';
import { Illustration } from '@/components/tutor/Illustration';
import { ReadingMaterial } from '@/components/tutor/ReadingMaterial';
import { FlashcardDeck } from '@/components/tutor/FlashcardDeck';
import { ExerciseSet } from '@/components/tutor/ExerciseSet';
import { Reflection } from '@/components/tutor/Reflection';
import { Directive } from '@/components/tutor/Directive';
import { Citation } from '@/components/ambient/Citation';
import { StreamingText } from '@/components/tutor/StreamingText';
import { InlineResponse } from '@/components/tutor/InlineResponse';

interface Props {
  entry: NotebookEntry;
  /** Callback when a directive is marked complete. Receives the entry content for mastery tracking. */
  onDirectiveComplete?: (content: string, action?: string) => void;
  /** Entry ID — passed to expandable components. */
  entryId?: string;
  /** Callback to replace this entry with an updated version (for expand/patch). */
  onPatchEntry?: (entry: NotebookEntry) => void;
}

export function NotebookEntryRenderer({ entry, onDirectiveComplete, onPatchEntry }: Props) {
  const { navigateTo } = useEntityNavigation();

  const handleNodeClick = useCallback((entityId: string, entityKind: string) => {
    navigateTo({
      target: { type: 'entity', entityId, entityKind },
      surface: entityKind === 'term' ? 'constellation' : 'notebook',
      highlight: true,
    });
  }, [navigateTo]);

  switch (entry.type) {
    // Student blocks
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

    // Rich content blocks
    case 'code-cell':
      return <CodeCell language={entry.language} source={entry.source} result={entry.result} />;
    case 'image':
      return <ImageEntry dataUrl={entry.dataUrl} alt={entry.alt} caption={entry.caption} />;
    case 'file-upload':
      return <FileUploadEntry file={entry.file} summary={entry.summary} />;
    case 'embed':
      return <EmbedEntry url={entry.url} title={entry.title}
        description={entry.description} favicon={entry.favicon} />;
    case 'document':
      return <DocumentEntry file={entry.file} pages={entry.pages}
        extractedText={entry.extractedText} />;

    // Tutor blocks
    case 'tutor-marginalia':
      return <Marginalia>{entry.content}</Marginalia>;
    case 'tutor-question':
      return <SocraticQuestion>{entry.content}</SocraticQuestion>;
    case 'tutor-connection':
      return <Connection emphasisEnd={entry.emphasisEnd}>{entry.content}</Connection>;
    case 'concept-diagram':
      return (
        <ConceptDiagram
          items={entry.items}
          edges={entry.edges}
          title={entry.title}
          layout={entry.layout}
          onNodeClick={handleNodeClick}
        />
      );
    case 'thinker-card':
      return <ThinkerCard thinker={entry.thinker} />;

    // Inline response blocks
    case 'inline-response':
      return (
        <InlineResponse quotedText={entry.quotedText} intent={entry.intent}>
          {entry.content}
        </InlineResponse>
      );

    // AI-generated blocks
    case 'podcast':
      return <PodcastPlayer topic={entry.topic} audioUrl={entry.audioUrl}
        segments={entry.segments} transcript={entry.transcript}
        duration={entry.duration} coverUrl={entry.coverUrl} />;
    case 'visualization':
      return <Visualization html={entry.html} caption={entry.caption} />;
    case 'illustration':
      return <Illustration dataUrl={entry.dataUrl} caption={entry.caption} />;
    case 'reading-material':
      return <ReadingMaterial title={entry.title} subtitle={entry.subtitle}
        slides={entry.slides} coverUrl={entry.coverUrl}
        onPatch={onPatchEntry ? (slides, coverUrl) => onPatchEntry({
          ...entry, slides, coverUrl,
        }) : undefined} />;
    case 'flashcard-deck':
      return <FlashcardDeck title={entry.title} cards={entry.cards} />;
    case 'exercise-set':
      return <ExerciseSet title={entry.title} exercises={entry.exercises}
        difficulty={entry.difficulty} />;

    // System blocks
    case 'silence':
      return <SilenceMarker text={entry.text} />;
    case 'divider':
      return <Divider label={entry.label} />;
    case 'echo':
      return <Echo>{entry.content}</Echo>;
    case 'bridge-suggestion':
      return <BridgeSuggestion>{entry.content}</BridgeSuggestion>;
    case 'tutor-reflection':
      return <Reflection>{entry.content}</Reflection>;
    case 'tutor-directive':
      return (
        <Directive
          action={entry.action}
          completed={entry.completed}
          completedAt={entry.completedAt}
          onComplete={onDirectiveComplete
            ? () => onDirectiveComplete(entry.content, entry.action)
            : undefined}
        >
          {entry.content}
        </Directive>
      );
    case 'citation':
      return <Citation sources={entry.sources} />;
    case 'streaming-text':
      return <StreamingText done={entry.done}>{entry.content}</StreamingText>;
    default: {
      // Exhaustive check — TypeScript will error if a new entry type is added to NotebookEntry
      // but not handled above.
      const _exhaustive: never = entry;
      if (process.env.NODE_ENV !== 'production') console.warn(`Unhandled entry: "${(_exhaustive as { type: string }).type}"`);
      return null;
    }
  }
}
