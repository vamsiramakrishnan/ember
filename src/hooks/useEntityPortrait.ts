/**
 * useEntityPortrait — generates and caches AI portraits for thinkers.
 *
 * On first render of a ThinkerCard without a portrait, this hook
 * fires generatePortrait() in the background. The result is stored
 * in a module-level cache (Map) and persisted to the entry via
 * patchEntryContent. Subsequent renders use the cached data URL.
 *
 * No portrait is generated more than once per name per session.
 */
import { useState, useEffect, useRef } from 'react';
import { generatePortrait } from '@/services/visual-generation';

/** Module-level cache: thinker name → data URL (or null if generation failed). */
const portraitCache = new Map<string, string | null>();
/** In-flight promises to prevent duplicate generation. */
const inFlight = new Map<string, Promise<string | null>>();

interface UsePortraitResult {
  portraitUrl: string | null;
  loading: boolean;
}

export function useEntityPortrait(
  name: string,
  dates: string,
  existingUrl?: string,
  tradition?: string,
): UsePortraitResult {
  const [url, setUrl] = useState<string | null>(existingUrl ?? portraitCache.get(name) ?? null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // Already have a portrait
    if (existingUrl) { setUrl(existingUrl); return; }
    if (portraitCache.has(name)) { setUrl(portraitCache.get(name) ?? null); return; }

    // Generate in background
    setLoading(true);

    let promise = inFlight.get(name);
    if (!promise) {
      promise = generatePortrait(name, dates, tradition);
      inFlight.set(name, promise);
    }

    promise.then((result) => {
      portraitCache.set(name, result);
      inFlight.delete(name);
      if (mounted.current) {
        setUrl(result);
        setLoading(false);
      }
    }).catch(() => {
      portraitCache.set(name, null);
      inFlight.delete(name);
      if (mounted.current) setLoading(false);
    });
  }, [name, dates, existingUrl, tradition]);

  return { portraitUrl: url, loading };
}
