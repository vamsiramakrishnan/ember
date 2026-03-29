/**
 * /api/live-token — Vercel Edge Function that mints ephemeral tokens
 * for the Gemini Live API.
 *
 * Ephemeral tokens allow the browser to open a WebSocket directly to
 * Gemini without exposing the API key. Tokens are short-lived (2 min)
 * and scoped to the Live API model.
 *
 * See: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 */

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
    // Mint an ephemeral token via the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${LIVE_MODEL}:generateEphemeralToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          ephemeralToken: {
            expireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[live-token] Gemini error:', response.status, text);
      return new Response(
        JSON.stringify({ error: `Token generation failed: ${response.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
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
