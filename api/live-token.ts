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

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';

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

    return new Response(JSON.stringify({ token: token.name }), {
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
