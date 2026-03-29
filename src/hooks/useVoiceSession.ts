/**
 * useVoiceSession — bidirectional voice interface via Gemini Live API.
 *
 * Uses RAW WEBSOCKET (not the SDK's live.connect()) following the canonical
 * ephemeral token example from google-gemini/gemini-live-api-examples.
 *
 * The SDK's live.connect() has issues with ephemeral tokens on mobile browsers.
 * Raw WebSocket gives us full control over the connection, message format,
 * and error handling.
 *
 * Audio pipeline:
 *   mic → ScriptProcessorNode (downsample to 16kHz PCM) → WebSocket → Gemini
 *   Gemini → WebSocket → PCM 24kHz → AudioContext → speakers
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { executeTool, type ToolContext } from '@/services/tool-executor';
import {
  buildVoiceSystemInstruction, VOICE_TOOL_DECLARATIONS,
  type VoiceContextInput,
} from '@/services/voice-session-context';
import type { NotebookEntry, DiagramNode, DiagramEdge } from '@/types/entries';

// ─── Types ──────────────────────────────────────────────────

export type VoiceSessionState =
  | 'idle'
  | 'connecting'
  | 'active'
  | 'error';

export interface TranscriptLine {
  role: 'user' | 'tutor';
  text: string;
  timestamp: number;
  final: boolean;
}

export interface VoiceSessionCallbacks {
  onEntry: (entry: NotebookEntry) => void;
  onMasteryUpdate?: (concept: string, level: string, reason?: string) => void;
  onVocabAdd?: (term: string, definition: string, pronunciation?: string, etymology?: string) => void;
  onThinkerCard?: (name: string, dates?: string, tradition?: string, gift?: string, bridge?: string) => void;
}

interface UseVoiceSessionOptions {
  callbacks: VoiceSessionCallbacks;
  contextInput: VoiceContextInput;
  toolContext: ToolContext;
}

// ─── Constants ──────────────────────────────────────────────

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';

// ─── Hook ───────────────────────────────────────────────────

export function useVoiceSession({
  callbacks, contextInput, toolContext,
}: UseVoiceSessionOptions) {
  const [state, setState] = useState<VoiceSessionState>('idle');
  const stateRef = useRef(state);
  stateRef.current = state;
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  /** Debug status visible in the UI — tracks every connection step. */
  const [debugStatus, setDebugStatus] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Audio playback queue
  const playbackQueue = useRef<ArrayBuffer[]>([]);
  const isPlaying = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  /** Play queued PCM 24kHz audio chunks. */
  const playNextChunk = useCallback(() => {
    const ctx = playbackCtxRef.current;
    if (!ctx || playbackQueue.current.length === 0) {
      isPlaying.current = false;
      currentSourceRef.current = null;
      setIsTutorSpeaking(false);
      return;
    }
    isPlaying.current = true;
    setIsTutorSpeaking(true);

    const pcmData = playbackQueue.current.shift()!;
    const float32 = pcm16ToFloat32(pcmData);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (currentSourceRef.current === source) currentSourceRef.current = null;
      playNextChunk();
    };
    currentSourceRef.current = source;
    source.start();
  }, []);

  const enqueueAudio = useCallback((base64Data: string) => {
    const binary = atob(base64Data);
    const bytes = new ArrayBuffer(binary.length);
    const view = new Uint8Array(bytes);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    playbackQueue.current.push(bytes);
    if (!isPlaying.current) playNextChunk();
  }, [playNextChunk]);

  const clearPlayback = useCallback(() => {
    playbackQueue.current = [];
    isPlaying.current = false;
    try { currentSourceRef.current?.stop(); } catch { /* ok */ }
    currentSourceRef.current = null;
    setIsTutorSpeaking(false);
  }, []);

  // ─── Tool handling ──────────────────────────────────────────

  const toolContextRef = useRef(toolContext);
  toolContextRef.current = toolContext;

  const handleToolCall = useCallback(async (
    fc: { name: string; args: Record<string, unknown> },
  ): Promise<Record<string, unknown>> => {
    const { name, args } = fc;
    const cbs = callbacksRef.current;
    const ctx = toolContextRef.current;

    switch (name) {
      case 'addNotebookEntry': {
        const entryType = (args.entryType as string) ?? 'tutor-marginalia';
        const content = (args.content as string) ?? '';
        cbs.onEntry({ type: entryType as NotebookEntry['type'], content } as NotebookEntry);
        return { success: true };
      }
      case 'addConceptDiagram': {
        const nodes = (args.nodes as DiagramNode[]) ?? [];
        const edges = (args.edges as DiagramEdge[]) ?? [];
        cbs.onEntry({
          type: 'concept-diagram',
          items: nodes.map((n, i) => ({ ...n, entityId: `voice-node-${i}` })),
          edges, title: (args.title as string) ?? undefined,
        } as NotebookEntry);
        return { success: true };
      }
      case 'addThinkerCard': {
        cbs.onThinkerCard?.(args.name as string, args.dates as string | undefined,
          args.tradition as string | undefined, args.gift as string | undefined,
          args.bridge as string | undefined);
        cbs.onEntry({
          type: 'thinker-card',
          thinker: { name: args.name as string, dates: (args.dates as string) ?? '',
            gift: (args.gift as string) ?? '', bridge: (args.bridge as string) ?? '' },
        } as NotebookEntry);
        return { success: true };
      }
      case 'addVocabularyTerm': {
        cbs.onVocabAdd?.(args.term as string, args.definition as string,
          args.pronunciation as string | undefined, args.etymology as string | undefined);
        return { success: true };
      }
      case 'updateConceptMastery': {
        cbs.onMasteryUpdate?.(args.concept as string, args.level as string,
          args.reason as string | undefined);
        return { success: true };
      }
      case 'searchHistory': case 'lookupConcept': case 'lookupThinker':
      case 'lookupTerm': case 'getConnections': case 'discoverGaps': {
        const nameMap: Record<string, string> = {
          searchHistory: 'search_history', lookupConcept: 'lookup_concept',
          lookupThinker: 'lookup_thinker', lookupTerm: 'lookup_term',
          getConnections: 'get_connections', discoverGaps: 'discover_gaps',
        };
        try {
          const result = await executeTool(nameMap[name] ?? name, args, ctx);
          return { result };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Tool failed' };
        }
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }, []);

  /** Send a JSON message over the WebSocket. */
  const wsSend = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  /** Start a voice session using RAW WEBSOCKET. */
  const start = useCallback(async () => {
    setError(null);
    setState('connecting');
    setTranscript([]);
    setElapsed(0);

    try {
      // 1. Fetch ephemeral token
      setDebugStatus('fetching token…');
      const tokenRes = await fetch('/api/live-token', { method: 'POST' });
      if (!tokenRes.ok) {
        const errBody = await tokenRes.text().catch(() => '');
        throw new Error(`Token failed (${tokenRes.status}): ${errBody}`);
      }
      const tokenData = await tokenRes.json();
      const token = tokenData.token as string | undefined;
      if (!token) throw new Error(`No token: ${JSON.stringify(tokenData).slice(0, 300)}`);
      setDebugStatus(`token ok: ${token.slice(0, 20)}…`);

      // 2. Get microphone
      setDebugStatus('requesting mic…');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setDebugStatus('mic granted');

      // 3. AudioContexts
      const captureCtx = new AudioContext();
      captureCtxRef.current = captureCtx;
      if (captureCtx.state === 'suspended') await captureCtx.resume();

      const playbackCtx = new AudioContext();
      playbackCtxRef.current = playbackCtx;
      if (playbackCtx.state === 'suspended') await playbackCtx.resume();
      setDebugStatus(`audio ctx: capture=${captureCtx.sampleRate} playback=${playbackCtx.sampleRate}`);

      // 4. Open RAW WEBSOCKET
      setDebugStatus('opening websocket…');
      const wsUrl = `${WS_BASE}?access_token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Connection timeout
      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('[VoiceSession] Connection timeout (10s)');
          setError('Connection timeout');
          setState('error');
          ws.close();
          cleanup();
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        setDebugStatus('ws connected, sending setup…');

        // 5. Send setup message (first message must be config)
        const fullInstruction = buildVoiceSystemInstruction(contextInput);
        const setupMsg = {
          setup: {
            model: `models/${LIVE_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: fullInstruction }],
            },
            tools: VOICE_TOOL_DECLARATIONS,
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
                endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
                prefixPaddingMs: 20,
                silenceDurationMs: 500,
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            contextWindowCompression: { slidingWindow: {} },
            sessionResumption: {},
          },
        };
        ws.send(JSON.stringify(setupMsg));
        console.info('[VoiceSession] Setup message sent');
      };

      ws.onmessage = async (event) => {
        // Mobile browsers may deliver WebSocket messages as Blob, not string
        let rawData: string;
        if (event.data instanceof Blob) {
          rawData = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          rawData = new TextDecoder().decode(event.data);
        } else {
          rawData = event.data as string;
        }

        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(rawData);
        } catch {
          console.warn('[VoiceSession] Non-JSON message:', rawData?.slice(0, 100));
          return;
        }

        // Setup complete — start streaming audio
        if (msg.setupComplete) {
          setDebugStatus('setup complete! starting mic capture…');
          setState('active');
          startAudioCapture(ws, captureCtx, stream);
          timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
          setTimeout(() => setDebugStatus(''), 3000); // Clear after 3s
        }

        // Server content — audio, transcriptions, interruptions
        const sc = msg.serverContent as Record<string, unknown> | undefined;
        if (sc) {
          // Audio output
          const modelTurn = sc.modelTurn as Record<string, unknown> | undefined;
          if (modelTurn?.parts) {
            const parts = modelTurn.parts as Array<Record<string, unknown>>;
            for (const part of parts) {
              const inlineData = part.inlineData as Record<string, unknown> | undefined;
              if (inlineData?.data) {
                enqueueAudio(inlineData.data as string);
              }
            }
          }

          // Input transcription
          const inputTx = sc.inputTranscription as Record<string, unknown> | undefined;
          if (inputTx?.text) {
            const text = inputTx.text as string;
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'user' && !last.final) {
                return [...prev.slice(0, -1), { ...last, text, final: true }];
              }
              return [...prev, { role: 'user', text, timestamp: Date.now(), final: true }];
            });
          }

          // Output transcription
          const outputTx = sc.outputTranscription as Record<string, unknown> | undefined;
          if (outputTx?.text) {
            const text = outputTx.text as string;
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'tutor' && !last.final) {
                return [...prev.slice(0, -1), { ...last, text: last.text + text }];
              }
              return [...prev, { role: 'tutor', text, timestamp: Date.now(), final: false }];
            });
          }

          // Interruption
          if (sc.interrupted === true) clearPlayback();

          // Turn complete
          if (sc.turnComplete === true) {
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'tutor') return [...prev.slice(0, -1), { ...last, final: true }];
              return prev;
            });
            setIsTutorSpeaking(false);
          }
        }

        // Tool calls
        const tc = msg.toolCall as Record<string, unknown> | undefined;
        if (tc) {
          const calls = (tc.functionCalls ?? []) as Array<{
            id: string; name: string; args: Record<string, unknown>;
          }>;
          for (const call of calls) {
            void (async () => {
              try {
                const result = await handleToolCall({ name: call.name, args: call.args ?? {} });
                wsSend({
                  toolResponse: {
                    functionResponses: [{
                      id: call.id, name: call.name,
                      response: { ...result, scheduling: 'SILENT' },
                    }],
                  },
                });
              } catch (err) {
                console.warn('[VoiceSession] Tool error:', call.name, err);
                wsSend({
                  toolResponse: {
                    functionResponses: [{
                      id: call.id, name: call.name,
                      response: { error: 'Tool failed', scheduling: 'SILENT' },
                    }],
                  },
                });
              }
            })();
          }
        }

        // Session resumption
        const sru = msg.sessionResumptionUpdate as Record<string, unknown> | undefined;
        if (sru?.newHandle) {
          console.info('[VoiceSession] Session resumption handle received');
        }

        // GoAway
        if (msg.goAway) {
          console.info('[VoiceSession] GoAway received');
        }
      };

      ws.onerror = () => {
        clearTimeout(connectTimeout);
        setDebugStatus('ws error');
        setError('WebSocket failed — tap to retry');
        setState('error');
      };

      ws.onclose = (event) => {
        clearTimeout(connectTimeout);
        if (event.code !== 1000 && stateRef.current !== 'idle') {
          setDebugStatus(`ws closed: code=${event.code}`);
          setError(event.reason || `Closed (${event.code})`);
          setState('error');
        } else {
          setDebugStatus('');
          setState('idle');
        }
      };

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start voice session';
      console.error('[VoiceSession] Start error:', msg);
      setError(msg);
      setState('error');
      cleanup();
    }
  }, [contextInput, enqueueAudio, clearPlayback, handleToolCall, wsSend]);

  /** Start mic capture and stream to WebSocket. */
  function startAudioCapture(ws: WebSocket, captureCtx: AudioContext, stream: MediaStream) {
    const micSource = captureCtx.createMediaStreamSource(stream);
    const processor = captureCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const captureRate = captureCtx.sampleRate;
    const targetRate = 16000;
    let sendCount = 0;

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);

      // Downsample from device rate to 16kHz
      let samples: Float32Array;
      if (Math.abs(captureRate - targetRate) < 100) {
        samples = inputData;
      } else {
        const ratio = captureRate / targetRate;
        const outLen = Math.floor(inputData.length / ratio);
        samples = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
          samples[i] = inputData[Math.floor(i * ratio)]!;
        }
      }

      const pcm = float32ToPcm16(samples);
      const base64 = arrayBufferToBase64(pcm.buffer as ArrayBuffer);

      if (sendCount < 3) {
        const nonZero = Array.from(pcm).some((v) => v !== 0);
        console.info(`[VoiceSession] Audio #${sendCount}: ${pcm.length} samples, data=${nonZero}`);
      }
      sendCount++;

      ws.send(JSON.stringify({
        realtimeInput: {
          audio: { data: base64, mimeType: 'audio/pcm' },
        },
      }));
    };

    micSource.connect(processor);
    const silentDest = captureCtx.createGain();
    silentDest.gain.value = 0;
    silentDest.connect(captureCtx.destination);
    processor.connect(silentDest);

    console.info('[VoiceSession] Audio capture started at', captureRate, '→', targetRate, 'Hz');
  }

  const stop = useCallback(() => {
    cleanup();
    setState('idle');
  }, []);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    captureCtxRef.current?.close().catch(() => {});
    clearPlayback();
    playbackCtxRef.current?.close().catch(() => {});
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
        wsRef.current.close();
      }
    } catch { /* ignore */ }
    wsRef.current = null;
    streamRef.current = null;
    captureCtxRef.current = null;
    playbackCtxRef.current = null;
    processorRef.current = null;
  }

  useEffect(() => {
    return () => { cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, error, transcript, isTutorSpeaking, elapsed, start, stop, debugStatus };
}

// ─── Audio utilities ────────────────────────────────────────

function float32ToPcm16(float32: Float32Array): Int16Array {
  const pcm = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}

function pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
  const int16 = new Int16Array(buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = (int16[i] ?? 0) / 0x8000;
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
