/**
 * useVoiceSession — bidirectional voice interface via Gemini Live API.
 *
 * Manages the full lifecycle:
 * 1. Fetch ephemeral token from /api/live-token
 * 2. Open WebSocket to Gemini Live API
 * 3. Stream mic audio (PCM 16kHz) to Gemini
 * 4. Receive and play audio responses (PCM 24kHz)
 * 5. Surface input/output transcripts in real-time
 * 6. Handle function calls to create notebook entries
 * 7. Handle VAD interruptions
 *
 * Audio pipeline:
 *   mic → AudioWorklet (resample to 16kHz PCM) → WebSocket → Gemini
 *   Gemini → WebSocket → PCM 24kHz → AudioContext → speakers
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { isGeminiAvailable } from '@/services/gemini';
import type { NotebookEntry } from '@/types/entries';

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
  /** Called when a function call creates a notebook entry. */
  onEntry: (entry: NotebookEntry) => void;
  /** Called when mastery should be updated. */
  onMasteryUpdate?: (concept: string, level: string) => void;
  /** Called when a vocab term should be added. */
  onVocabAdd?: (term: string, definition: string, etymology?: string) => void;
}

interface UseVoiceSessionOptions {
  callbacks: VoiceSessionCallbacks;
  systemInstruction: string;
  sessionTopic: string;
  notebookContext: string;
}

// ─── Constants ──────────────────────────────────────────────

const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

/** Tool declarations for the Live API session.
 *  Typed loosely to match the Live API's tool format. */
const VOICE_TOOLS: Array<Record<string, unknown>> = [
  {
    functionDeclarations: [
      {
        name: 'addNotebookEntry',
        description: 'Add a prose entry, tutor note, or concept to the student notebook. Use this to record key points, insights, and explanations as the conversation progresses.',
        parameters: {
          type: 'OBJECT',
          properties: {
            entryType: {
              type: 'STRING',
              enum: ['prose', 'tutor-marginalia', 'tutor-question', 'tutor-connection'],
              description: 'The type of notebook entry',
            },
            content: { type: 'STRING', description: 'The text content of the entry' },
          },
          required: ['entryType', 'content'],
        },
      },
      {
        name: 'addVocabularyTerm',
        description: 'Add a new term to the student lexicon when you introduce or define technical vocabulary.',
        parameters: {
          type: 'OBJECT',
          properties: {
            term: { type: 'STRING' },
            definition: { type: 'STRING' },
            etymology: { type: 'STRING', description: 'Optional word origin' },
          },
          required: ['term', 'definition'],
        },
      },
      {
        name: 'updateConceptMastery',
        description: 'Update the student mastery level for a concept based on their demonstrated understanding.',
        parameters: {
          type: 'OBJECT',
          properties: {
            concept: { type: 'STRING' },
            level: { type: 'STRING', enum: ['exploring', 'developing', 'strong', 'mastered'] },
          },
          required: ['concept', 'level'],
        },
      },
    ],
  },
];

// ─── Hook ───────────────────────────────────────────────────

export function useVoiceSession({
  callbacks, systemInstruction, sessionTopic, notebookContext,
}: UseVoiceSessionOptions) {
  const [state, setState] = useState<VoiceSessionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  /** Session resumption handle — stored from sessionResumptionUpdate messages. */
  const resumeHandleRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Audio playback queue
  const playbackQueue = useRef<ArrayBuffer[]>([]);
  const isPlaying = useRef(false);

  /** Play queued PCM audio chunks through AudioContext. */
  const playNextChunk = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || playbackQueue.current.length === 0) {
      isPlaying.current = false;
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
    source.onended = playNextChunk;
    source.start();
  }, []);

  /** Enqueue audio data for playback. */
  const enqueueAudio = useCallback((base64Data: string) => {
    const binary = atob(base64Data);
    const bytes = new ArrayBuffer(binary.length);
    const view = new Uint8Array(bytes);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    playbackQueue.current.push(bytes);
    if (!isPlaying.current) playNextChunk();
  }, [playNextChunk]);

  /** Clear audio playback (on interruption). */
  const clearPlayback = useCallback(() => {
    playbackQueue.current = [];
    isPlaying.current = false;
    setIsTutorSpeaking(false);
  }, []);

  /** Handle function calls from the Live API. */
  const handleToolCall = useCallback((
    functionCall: { name: string; args: Record<string, unknown> },
  ) => {
    const { name, args } = functionCall;
    const cbs = callbacksRef.current;

    switch (name) {
      case 'addNotebookEntry': {
        const entryType = (args.entryType as string) ?? 'tutor-marginalia';
        const content = (args.content as string) ?? '';
        cbs.onEntry({ type: entryType as NotebookEntry['type'], content } as NotebookEntry);
        return { success: true };
      }
      case 'addVocabularyTerm': {
        cbs.onVocabAdd?.(
          args.term as string,
          args.definition as string,
          args.etymology as string | undefined,
        );
        return { success: true };
      }
      case 'updateConceptMastery': {
        cbs.onMasteryUpdate?.(args.concept as string, args.level as string);
        return { success: true };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }, []);

  /** Start a voice session. */
  const start = useCallback(async () => {
    setError(null);
    setState('connecting');
    setTranscript([]);
    setElapsed(0);

    try {
      // 1. Get ephemeral token or use direct API key
      let client: GoogleGenAI;
      if (API_KEY) {
        client = new GoogleGenAI({ apiKey: API_KEY });
      } else if (isGeminiAvailable()) {
        const tokenRes = await fetch('/api/live-token', { method: 'POST' });
        if (!tokenRes.ok) throw new Error('Failed to get ephemeral token');
        const tokenData = await tokenRes.json();
        const token = tokenData.token;
        if (!token) throw new Error('No token in response');
        client = new GoogleGenAI({ apiKey: token });
      } else {
        throw new Error('No Gemini API key configured');
      }

      // 2. Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;

      // 3. Set up AudioContext for both capture and playback
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      // 4. Connect to Gemini Live API
      const fullInstruction = [
        systemInstruction,
        `\nCurrent topic: ${sessionTopic}`,
        notebookContext ? `\nNotebook context:\n${notebookContext}` : '',
        '\nIMPORTANT: As you discuss ideas with the student, use the addNotebookEntry tool to record key points, insights, and explanations in their notebook. Use addVocabularyTerm when introducing technical terms. Use updateConceptMastery when the student demonstrates understanding.',
      ].join('');

      const session = await client.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: fullInstruction }] },
          tools: VOICE_TOOLS as never[],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // Session management: compression for long sessions, resumption for reconnects
          contextWindowCompression: { slidingWindow: {} },
          sessionResumption: { handle: resumeHandleRef.current ?? undefined },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
        callbacks: {
          onopen: () => {
            setState('active');
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            const tc = message.toolCall;

            if (content) {
              // Audio output — process ALL parts in each event
              if (content.modelTurn?.parts) {
                for (const part of content.modelTurn.parts) {
                  if ('inlineData' in part && part.inlineData?.data) {
                    enqueueAudio(part.inlineData.data);
                  }
                }
              }

              // Input transcription (what the student said)
              const inputTx = content.inputTranscription;
              if (inputTx?.text) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'user' && !last.final) {
                    return [...prev.slice(0, -1), {
                      ...last, text: inputTx.text!, final: true,
                    }];
                  }
                  return [...prev, {
                    role: 'user', text: inputTx.text!,
                    timestamp: Date.now(), final: true,
                  }];
                });
              }

              // Output transcription (what the tutor said)
              const outputTx = content.outputTranscription;
              if (outputTx?.text) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'tutor' && !last.final) {
                    return [...prev.slice(0, -1), {
                      ...last, text: last.text + outputTx.text!,
                    }];
                  }
                  return [...prev, {
                    role: 'tutor', text: outputTx.text!,
                    timestamp: Date.now(), final: false,
                  }];
                });
              }

              // Interruption — clear playback queue
              if (content.interrupted === true) {
                clearPlayback();
              }

              // Turn complete — mark last tutor transcript as final
              if (content.turnComplete === true) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === 'tutor') {
                    return [...prev.slice(0, -1), { ...last, final: true }];
                  }
                  return prev;
                });
                setIsTutorSpeaking(false);
              }
            }

            // Function calling — synchronous tool use
            if (tc?.functionCalls) {
              const responses = tc.functionCalls.map((call) => ({
                id: call.id,
                response: handleToolCall({
                  name: call.name ?? '',
                  args: (call.args ?? {}) as Record<string, unknown>,
                }),
              }));
              if (session && responses.length > 0) {
                session.sendToolResponse({ functionResponses: responses });
              }
            }

            // Session resumption — store handle for reconnects
            if (message.sessionResumptionUpdate?.resumable) {
              const newHandle = (message.sessionResumptionUpdate as { newHandle?: string }).newHandle;
              if (newHandle) resumeHandleRef.current = newHandle;
            }

            // GoAway — server about to disconnect, auto-reconnect with resumption
            if (message.goAway) {
              console.info('[VoiceSession] GoAway received, will reconnect');
              // The onclose handler will fire; we could auto-resume here
              // For now, just log — the user can restart if needed
            }
          },
          onerror: (err: unknown) => {
            console.error('[VoiceSession] Error:', err);
            setError(err instanceof Error ? err.message : 'Connection error');
          },
          onclose: () => {
            setState('idle');
          },
        },
      });

      sessionRef.current = session as typeof sessionRef.current;

      // 5. Stream mic audio to the session
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 → Int16 PCM
        const pcm = float32ToPcm16(inputData);
        const base64 = arrayBufferToBase64(pcm.buffer as ArrayBuffer);
        try {
          (session as { sendRealtimeInput: (d: unknown) => void }).sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          });
        } catch {
          // Session may have closed
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination); // Required for processing to work

      // 6. Start elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start voice session';
      setError(msg);
      setState('error');
      cleanup();
    }
  }, [systemInstruction, sessionTopic, notebookContext, enqueueAudio, clearPlayback, handleToolCall]);

  /** Stop the voice session. */
  const stop = useCallback(() => {
    cleanup();
    setState('idle');
  }, []);

  /** Clean up all resources. */
  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close().catch(() => {});
    clearPlayback();
    try {
      (sessionRef.current as { close?: () => void })?.close?.();
    } catch { /* ignore */ }
    streamRef.current = null;
    audioContextRef.current = null;
    processorRef.current = null;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanup(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    error,
    transcript,
    isTutorSpeaking,
    elapsed,
    start,
    stop,
  };
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
