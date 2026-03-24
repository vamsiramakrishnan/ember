/**
 * useAmbientTexture — generates a subtle session-specific background.
 *
 * When the session topic changes, this hook generates a 512x512
 * ambient texture tile via the illustrator agent. The texture is
 * meant to be displayed at 3-5% opacity as a CSS background-image
 * on the Shell, creating a barely-visible atmospheric layer that
 * changes what you're studying "feels" like.
 *
 * Caches per topic. Never generates the same texture twice.
 */
import { useState, useEffect, useRef } from 'react';
import { generateAmbientTexture } from '@/services/visual-generation';

const textureCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

export function useAmbientTexture(topic: string | null): string | null {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!topic) { setTextureUrl(null); return; }

    // Check cache first
    if (textureCache.has(topic)) {
      setTextureUrl(textureCache.get(topic) ?? null);
      return;
    }

    let promise = inFlight.get(topic);
    if (!promise) {
      promise = generateAmbientTexture(topic);
      inFlight.set(topic, promise);
    }

    promise.then((result) => {
      textureCache.set(topic, result);
      inFlight.delete(topic);
      if (mounted.current) setTextureUrl(result);
    }).catch(() => {
      textureCache.set(topic, null);
      inFlight.delete(topic);
    });
  }, [topic]);

  return textureUrl;
}
