/**
 * Constellation — Surface 2: The Bookshelf
 * The student's intellectual map. Enriched with Lexicon,
 * Encounters, and Library drawn from prototypes.
 * See: 04-information-architecture.md, Surface two.
 */
import { useState, useEffect } from 'react';
import { traceSurfaceRender, trackEvent } from '@/observability';
import { Column } from '@/primitives/Column';
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { useMasteryData } from '@/hooks/useMasteryData';
import { useStudent } from '@/contexts/StudentContext';
import { spacing } from '@/tokens/spacing';
import { ConstellationOverview } from './ConstellationOverview';
import { ConstellationLexicon } from './ConstellationLexicon';
import { ConstellationEncounters } from './ConstellationEncounters';
import { ConstellationLibrary } from './ConstellationLibrary';
import styles from './Constellation.module.css';

type ConstellationView = 'overview' | 'lexicon' | 'encounters' | 'library';

const viewTabs: { id: ConstellationView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'lexicon', label: 'Lexicon' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'library', label: 'Library' },
];

export function Constellation() {
  useEffect(() => { const done = traceSurfaceRender('Constellation'); return done; }, []);
  const { concepts, threads, thinkers, lexicon, encounters, library } =
    useMasteryData();
  const { notebook } = useStudent();
  const [view, setView] = useState<ConstellationView>('overview');
  const handleViewChange = (v: ConstellationView) => {
    setView(v);
    trackEvent('constellation-tab', { view: v });
  };
  const subtitle = notebook?.summary || notebook?.description;

  return (
    <Column wide>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          {notebook?.iconDataUrl && (
            <img src={notebook.iconDataUrl} alt=""
              className={styles.notebookIcon} aria-hidden="true" />
          )}
          <div>
            <Text variant="pageTitle" as="h1" style={{ marginBottom: 4 }}>
              {notebook?.title ?? 'Constellation'}
            </Text>
            {notebook?.discipline && (
              <Text variant="systemMeta" as="span" className={styles.discipline}>
                {notebook.discipline}
              </Text>
            )}
          </div>
        </div>
        {subtitle && (
          <Text variant="bodySecondary" as="p"
            style={{ marginBottom: 4, fontStyle: 'italic' }}>
            {subtitle}
          </Text>
        )}
        {notebook?.tags && notebook.tags.length > 0 && (
          <div className={styles.tags}>
            {notebook.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        <nav className={styles.subNav} aria-label="Constellation views">
          {viewTabs.map((tab) => (
            <button key={tab.id} onClick={() => handleViewChange(tab.id)}
              className={tab.id === view ? styles.subTabActive : styles.subTab}
              aria-current={tab.id === view ? 'page' : undefined}>
              {tab.label}
            </button>
          ))}
        </nav>
        <Rule margin={spacing.sectionGap} />
        <div className={styles.viewContent} key={view}>
          {view === 'overview' && (
            <ConstellationOverview concepts={concepts}
              threads={threads} thinkers={thinkers} />
          )}
          {view === 'lexicon' && <ConstellationLexicon entries={lexicon} />}
          {view === 'encounters' && (
            <ConstellationEncounters encounters={encounters} />
          )}
          {view === 'library' && <ConstellationLibrary texts={library} />}
        </div>
        <div className={styles.spacer} />
      </div>
    </Column>
  );
}
