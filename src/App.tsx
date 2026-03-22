/**
 * App — Root component.
 * Flow: Landing (pick student) → NotebookSelect (pick notebook) → Surfaces.
 * Initialises persistence and seeds demo data on first run.
 */
import { useState, useEffect } from 'react';
import { Shell } from '@/layout/Shell';
import { Header } from '@/layout/Header';
import { Footer } from '@/layout/Footer';
import { Landing } from '@/surfaces/Landing';
import { NotebookSelect } from '@/surfaces/NotebookSelect';
import { Notebook } from '@/surfaces/Notebook';
import { Constellation } from '@/surfaces/Constellation';
import { Philosophy } from '@/surfaces/Philosophy';
import { StudentProvider, useStudent } from '@/contexts/StudentContext';
import { openDB } from '@/persistence';
import { seedIfEmpty } from '@/persistence/seed';
import { registerAdapter, startSync } from '@/persistence/sync';
import { createAdapterFromEnv } from '@/persistence/sync/supabase';
import type { Surface } from '@/layout/Navigation';

function ActiveSurface({ surface, onNavigate }: { surface: Surface; onNavigate: (s: Surface) => void }) {
  switch (surface) {
    case 'notebook':
      return <Notebook onNavigate={onNavigate} />;
    case 'constellation':
      return <Constellation />;
    case 'philosophy':
      return <Philosophy />;
  }
}

function AppContent() {
  const { student, notebook } = useStudent();
  const [surface, setSurface] = useState<Surface>('notebook');

  // No student selected → show landing
  if (!student) {
    return (
      <Shell>
        <Landing />
      </Shell>
    );
  }

  // Student selected but no notebook → show notebook picker
  if (!notebook) {
    return (
      <Shell>
        <Header activeSurface={surface} onNavigate={setSurface} />
        <main style={{ minHeight: '80vh' }}>
          <NotebookSelect />
        </main>
        <Footer />
      </Shell>
    );
  }

  // Full experience
  return (
    <Shell>
      <Header activeSurface={surface} onNavigate={setSurface} />
      <main style={{ minHeight: '80vh' }}>
        <ActiveSurface surface={surface} onNavigate={setSurface} />
      </main>
      <Footer />
    </Shell>
  );
}

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    openDB()
      .then(() => seedIfEmpty())
      .then(() => {
        const adapter = createAdapterFromEnv();
        if (adapter) {
          registerAdapter(adapter);
          startSync();
        }
        setReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialise database:', err);
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return (
    <StudentProvider>
      <AppContent />
    </StudentProvider>
  );
}
