/**
 * App — Root component.
 * Wires the three surfaces to tab navigation within the shell.
 * Initialises persistence, seeds demo data, and starts background sync.
 */
import { useState, useEffect } from 'react';
import { Shell } from '@/layout/Shell';
import { Header } from '@/layout/Header';
import { Footer } from '@/layout/Footer';
import { Notebook } from '@/surfaces/Notebook';
import { Constellation } from '@/surfaces/Constellation';
import { Philosophy } from '@/surfaces/Philosophy';
import { openDB } from '@/persistence';
import { seedIfEmpty } from '@/persistence/seed';
import { registerAdapter, startSync } from '@/persistence/sync';
import { createAdapterFromEnv } from '@/persistence/sync/supabase';
import type { Surface } from '@/layout/Navigation';

function ActiveSurface({ surface }: { surface: Surface }) {
  switch (surface) {
    case 'notebook':
      return <Notebook />;
    case 'constellation':
      return <Constellation />;
    case 'philosophy':
      return <Philosophy />;
  }
}

export function App() {
  const [surface, setSurface] = useState<Surface>('notebook');
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
    <Shell>
      <Header activeSurface={surface} onNavigate={setSurface} />
      <main style={{ minHeight: '80vh' }}>
        <ActiveSurface surface={surface} />
      </main>
      <Footer />
    </Shell>
  );
}
