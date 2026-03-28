/**
 * App — Root component.
 * Flow: Landing (pick student) → NotebookSelect (pick notebook) → Surfaces.
 * Initialises persistence, observability, and seeds demo data on first run.
 */
import { lazy, Suspense, useState, useEffect } from 'react';
import { Shell } from '@/layout/Shell';
import { Header } from '@/layout/Header';
import { Footer } from '@/layout/Footer';
import { StudentProvider, useStudent } from '@/contexts/StudentContext';
import { EntityNavigationProvider } from '@/hooks/useEntityNavigation';
import { useEntityResolver } from '@/hooks/useEntityResolver';
import { openDB } from '@/persistence';
import { seedIfEmpty } from '@/persistence/seed';
import { registerAdapter, startSync } from '@/persistence/sync';
import { createAdapterFromEnv } from '@/persistence/sync/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SurfaceErrorBoundary } from '@/components/SurfaceErrorBoundary';
import { SurfaceCrossfade } from '@/layout/SurfaceCrossfade';
import { initObservability } from '@/observability';
import type { Surface } from '@/layout/Navigation';

/* Lazy-loaded surfaces — each in its own chunk */
const Notebook = lazy(() =>
  import('@/surfaces/Notebook').then(m => ({ default: m.Notebook }))
);
const Constellation = lazy(() =>
  import('@/surfaces/Constellation').then(m => ({ default: m.Constellation }))
);
const Philosophy = lazy(() =>
  import('@/surfaces/Philosophy').then(m => ({ default: m.Philosophy }))
);
const Landing = lazy(() =>
  import('@/surfaces/Landing').then(m => ({ default: m.Landing }))
);
const NotebookSelect = lazy(() =>
  import('@/surfaces/NotebookSelect').then(m => ({ default: m.NotebookSelect }))
);

/** Invisible loader — Ember shows nothing rather than a spinner. */
function SurfaceLoader() {
  return <div style={{ minHeight: '80vh' }} aria-busy="true" />;
}

function ActiveSurface({
  surface,
  onNavigate,
}: {
  surface: Surface;
  onNavigate: (s: Surface) => void;
}) {
  const handleRecovery = () => onNavigate('notebook');

  switch (surface) {
    case 'notebook':
      return (
        <SurfaceErrorBoundary surface="Notebook" onRecover={handleRecovery}>
          <Suspense fallback={<SurfaceLoader />}>
            <Notebook onNavigate={onNavigate} />
          </Suspense>
        </SurfaceErrorBoundary>
      );
    case 'constellation':
      return (
        <SurfaceErrorBoundary surface="Constellation" onRecover={handleRecovery}>
          <Suspense fallback={<SurfaceLoader />}>
            <Constellation />
          </Suspense>
        </SurfaceErrorBoundary>
      );
    case 'philosophy':
      return (
        <SurfaceErrorBoundary surface="Philosophy" onRecover={handleRecovery}>
          <Suspense fallback={<SurfaceLoader />}>
            <Philosophy />
          </Suspense>
        </SurfaceErrorBoundary>
      );
  }
}

function AppContent() {
  const { student, notebook } = useStudent();
  const [surface, setSurface] = useState<Surface>('notebook');
  const { resolveEntity, resolveByName } = useEntityResolver();

  // No student selected → show landing
  if (!student) {
    return (
      <Shell>
        <Suspense fallback={<SurfaceLoader />}>
          <Landing />
        </Suspense>
      </Shell>
    );
  }

  // Student selected but no notebook → show notebook picker
  if (!notebook) {
    return (
      <Shell>
        <Header activeSurface={surface} onNavigate={setSurface} />
        <main style={{ minHeight: '80vh' }}>
          <Suspense fallback={<SurfaceLoader />}>
            <NotebookSelect />
          </Suspense>
        </main>
        <Footer />
      </Shell>
    );
  }

  // Full experience — wrapped in entity navigation for deep linking
  return (
    <EntityNavigationProvider
      onSurfaceChange={setSurface}
      resolveEntity={resolveEntity}
      resolveByName={resolveByName}
    >
      <Shell>
        <Header activeSurface={surface} onNavigate={setSurface} />
        <main style={{ minHeight: '80vh' }}>
          <SurfaceCrossfade surfaceKey={surface}>
            <ActiveSurface surface={surface} onNavigate={setSurface} />
          </SurfaceCrossfade>
        </main>
        <Footer />
      </Shell>
    </EntityNavigationProvider>
  );
}

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initObservability();

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
    <ErrorBoundary>
      <StudentProvider>
        <AppContent />
      </StudentProvider>
    </ErrorBoundary>
  );
}
