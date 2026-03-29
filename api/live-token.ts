/**
 * /api/live-token — Vercel Edge Function that mints ephemeral tokens
 * for the Gemini Live API.
 *
 * Uses the authTokens.create() SDK method (v1alpha) to create tokens
 * with liveConnectConstraints that lock down model, modality, and config.
 *
 * Token lifecycle:
 * - expireTime: 30 min — how long the token can send messages
 * - newSessionExpireTime: 1 min — how long it can open NEW sessions
 * - uses: 1 — one session per token (resumption reconnects are free)
 *
 * See: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 */
import { GoogleGenAI } from '@google/genai';

export const config = { runtime: 'edge' };

/** Gemini 2.5 Flash with native audio — supports async NON_BLOCKING function calling. */
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    console.info('[live-token] Creating ephemeral token for', LIVE_MODEL);
    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60_000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 60_000).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
        liveConnectConstraints: {
          model: `models/${LIVE_MODEL}`,
          config: {
            sessionResumption: {},
            responseModalities: ['AUDIO'],
          },
        },
      },
    });

    const tokenName = token.name;
    console.info('[live-token] Token created:', tokenName ? `${tokenName.slice(0, 20)}...` : 'EMPTY');

    if (!tokenName) {
      // Token creation succeeded but returned no name — log the full response
      console.error('[live-token] Empty token name. Full response:', JSON.stringify(token));
      return new Response(
        JSON.stringify({ error: 'Token created but name is empty', debug: JSON.stringify(token) }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ token: tokenName }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[live-token] Error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
