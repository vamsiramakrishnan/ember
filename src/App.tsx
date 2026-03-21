/**
 * App — Root component.
 * Wires the three surfaces to tab navigation within the shell.
 */
import { useState } from 'react';
import { Shell } from '@/layout/Shell';
import { Header } from '@/layout/Header';
import { Footer } from '@/layout/Footer';
import { Notebook } from '@/surfaces/Notebook';
import { Constellation } from '@/surfaces/Constellation';
import { Philosophy } from '@/surfaces/Philosophy';
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
