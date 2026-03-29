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
import {
  GoogleGenAI, Modality,
  StartSensitivity, EndSensitivity,
  FunctionResponseScheduling,
  type LiveServerMessage,
} from '@google/genai';
import { isGeminiAvailable } from '@/services/gemini';
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
  /** Called when a function call creates a notebook entry. */
  onEntry: (entry: NotebookEntry) => void;
  /** Called when mastery should be updated. */
  onMasteryUpdate?: (concept: string, level: string, reason?: string) => void;
  /** Called when a vocab term should be added. */
  onVocabAdd?: (term: string, definition: string, pronunciation?: string, etymology?: string) => void;
  /** Called when a thinker card should be added. */
  onThinkerCard?: (name: string, dates?: string, tradition?: string, gift?: string, bridge?: string) => void;
}

interface UseVoiceSessionOptions {
  callbacks: VoiceSessionCallbacks;
  /** Pre-assembled context for the system instruction. */
  contextInput: VoiceContextInput;
  /** Tool execution context (studentId, notebookId, sessionId). */
  toolContext: ToolContext;
}

// ─── Constants ──────────────────────────────────────────────

/** Gemini 2.5 Flash with native audio — supports async NON_BLOCKING function calling. */
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// ─── Hook ───────────────────────────────────────────────────

export function useVoiceSession({
  callbacks, contextInput, toolContext,
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

  // ─── Audio playback (separate context at native rate for output) ───
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Audio playback queue — sequential chunk playback
  const playbackQueue = useRef<ArrayBuffer[]>([]);
  const isPlaying = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  /** Play queued PCM 24kHz audio chunks through the playback AudioContext. */
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
    // Output is 24kHz PCM — create buffer at that rate regardless of context rate.
    // The AudioContext will resample to its own rate (typically 48kHz) for the speakers.
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (currentSourceRef.current === source) {
        currentSourceRef.current = null;
      }
      playNextChunk();
    };
    currentSourceRef.current = source;
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

  /** Clear audio playback (on interruption). Stop current source immediately. */
  const clearPlayback = useCallback(() => {
    playbackQueue.current = [];
    isPlaying.current = false;
    try {
      currentSourceRef.current?.stop();
    } catch { /* already stopped */ }
    currentSourceRef.current = null;
    setIsTutorSpeaking(false);
  }, []);

  /** Handle function calls from the Live API.
   *  Creation tools → local callbacks (instant).
   *  Discovery tools → tool executor (async, returns data). */
  const toolContextRef = useRef(toolContext);
  toolContextRef.current = toolContext;

  const handleToolCall = useCallback(async (
    functionCall: { name: string; args: Record<string, unknown> },
  ): Promise<Record<string, unknown>> => {
    const { name, args } = functionCall;
    const cbs = callbacksRef.current;
    const ctx = toolContextRef.current;

    switch (name) {
      // ── Creation tools (local, instant) ──
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
          edges,
          title: (args.title as string) ?? undefined,
        } as NotebookEntry);
        return { success: true };
      }
      case 'addThinkerCard': {
        cbs.onThinkerCard?.(
          args.name as string, args.dates as string | undefined,
          args.tradition as string | undefined, args.gift as string | undefined,
          args.bridge as string | undefined,
        );
        // Also create a thinker-card entry
        cbs.onEntry({
          type: 'thinker-card',
          thinker: {
            name: args.name as string,
            dates: (args.dates as string) ?? '',
            gift: (args.gift as string) ?? '',
            bridge: (args.bridge as string) ?? '',
          },
        } as NotebookEntry);
        return { success: true };
      }
      case 'addVocabularyTerm': {
        cbs.onVocabAdd?.(
          args.term as string, args.definition as string,
          args.pronunciation as string | undefined,
          args.etymology as string | undefined,
        );
        return { success: true };
      }
      case 'updateConceptMastery': {
        cbs.onMasteryUpdate?.(
          args.concept as string, args.level as string,
          args.reason as string | undefined,
        );
        return { success: true };
      }

      // ── Discovery tools (async, use tool executor) ──
      case 'searchHistory':
      case 'lookupConcept':
      case 'lookupThinker':
      case 'lookupTerm':
      case 'getConnections':
      case 'discoverGaps': {
        // Map voice tool names to executor tool names
        const toolNameMap: Record<string, string> = {
          searchHistory: 'search_history',
          lookupConcept: 'lookup_concept',
          lookupThinker: 'lookup_thinker',
          lookupTerm: 'lookup_term',
          getConnections: 'get_connections',
          discoverGaps: 'discover_gaps',
        };
        try {
          const result = await executeTool(toolNameMap[name] ?? name, args, ctx);
          return { result };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Tool failed' };
        }
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
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Log actual mic sample rate (getUserMedia sampleRate constraint is often ignored)
      const micTrack = stream.getAudioTracks()[0];
      const micSettings = micTrack?.getSettings();
      console.info('[VoiceSession] Mic sample rate:', micSettings?.sampleRate ?? 'unknown');

      // 3. AudioContexts — capture at DEVICE rate, playback at default.
      //    We do NOT force 16kHz on the AudioContext because many devices ignore it
      //    and silently create at 48kHz. Instead we capture at the device rate and
      //    downsample to 16kHz PCM before sending to Gemini.
      const captureCtx = new AudioContext();
      captureCtxRef.current = captureCtx;
      // Resume immediately — browsers suspend AudioContext until user gesture.
      // start() is called from a pointer event (long-press), which IS a gesture.
      if (captureCtx.state === 'suspended') await captureCtx.resume();
      console.info('[VoiceSession] Capture ctx rate:', captureCtx.sampleRate, 'state:', captureCtx.state);

      const playbackCtx = new AudioContext();
      playbackCtxRef.current = playbackCtx;
      if (playbackCtx.state === 'suspended') await playbackCtx.resume();

      // 4. Build system instruction from student context
      const fullInstruction = buildVoiceSystemInstruction(contextInput);

      // gemini-2.5-flash-native-audio config:
      // - Supports async NON_BLOCKING function calling (3.1 does not)
      // - Uses thinkingBudget (not thinkingLevel) — leave unset for default
      // - sendRealtimeInput for ALL real-time input (audio, video, text)
      const session = await client.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: fullInstruction }] },
          tools: VOICE_TOOL_DECLARATIONS as never[],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // No thinkingConfig — leave at default for 2.5 Flash
          // VAD: auto-detect speech with tuned sensitivity for tutoring
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              prefixPaddingMs: 20,
              silenceDurationMs: 500,
            },
          },
          // Session management
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
            console.info('[VoiceSession] WebSocket connected to', LIVE_MODEL);
            setState('active');
          },
          onmessage: (message: LiveServerMessage) => {
            // Diagnostic: log message types received
            const msgTypes: string[] = [];
            if (message.serverContent) msgTypes.push('serverContent');
            if (message.toolCall) msgTypes.push('toolCall');
            if (message.setupComplete) msgTypes.push('setupComplete');
            if (message.goAway) msgTypes.push('goAway');
            if (message.sessionResumptionUpdate) msgTypes.push('sessionResumption');
            if (msgTypes.length > 0) {
              console.debug('[VoiceSession] Received:', msgTypes.join(', '));
            }

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

            // Async NON_BLOCKING function calling — model continues speaking
            // while we execute the tool. SILENT scheduling = model absorbs
            // results without interrupting conversation flow.
            if (tc?.functionCalls) {
              for (const call of tc.functionCalls) {
                // Fire-and-forget: execute async, send response when ready
                void (async () => {
                  try {
                    const result = await handleToolCall({
                      name: call.name ?? '',
                      args: (call.args ?? {}) as Record<string, unknown>,
                    });
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name ?? '',
                        response: {
                          ...result,
                          scheduling: FunctionResponseScheduling.SILENT,
                        },
                      }],
                    });
                  } catch (err) {
                    console.warn('[VoiceSession] Tool error:', call.name, err);
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name ?? '',
                        response: {
                          error: 'Tool execution failed',
                          scheduling: FunctionResponseScheduling.SILENT,
                        },
                      }],
                    });
                  }
                })();
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

      // 5. Stream mic audio to Gemini.
      //    Capture at device rate → downsample to 16kHz → send as PCM.
      //    ScriptProcessorNode is deprecated but works cross-browser.
      const micSource = captureCtx.createMediaStreamSource(stream);
      const processor = captureCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const captureRate = captureCtx.sampleRate;
      const targetRate = 16000;
      let sendCount = 0;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Downsample from device rate (typically 48kHz) to 16kHz
        let samples: Float32Array;
        if (Math.abs(captureRate - targetRate) < 100) {
          // Already at ~16kHz, use directly
          samples = inputData;
        } else {
          // Downsample by taking every Nth sample
          const ratio = captureRate / targetRate;
          const outLen = Math.floor(inputData.length / ratio);
          samples = new Float32Array(outLen);
          for (let i = 0; i < outLen; i++) {
            samples[i] = inputData[Math.floor(i * ratio)]!;
          }
        }

        const pcm = float32ToPcm16(samples);
        const base64 = arrayBufferToBase64(pcm.buffer as ArrayBuffer);

        // Diagnostic: log first few sends to verify data is flowing
        if (sendCount < 3) {
          const nonZero = Array.from(pcm).some((v) => v !== 0);
          console.info(`[VoiceSession] Audio chunk #${sendCount}: ${pcm.length} samples, hasData=${nonZero}`);
        }
        sendCount++;

        try {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          });
        } catch {
          // Session may have closed
        }
      };

      micSource.connect(processor);
      // Silent destination — processor fires but mic audio doesn't play through speakers
      const silentDest = captureCtx.createGain();
      silentDest.gain.value = 0;
      silentDest.connect(captureCtx.destination);
      processor.connect(silentDest);

      console.info('[VoiceSession] Audio pipeline ready, streaming mic at', targetRate, 'Hz');

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
  }, [contextInput, enqueueAudio, clearPlayback, handleToolCall]);

  /** Stop the voice session. */
  const stop = useCallback(() => {
    cleanup();
    setState('idle');
  }, []);

  /** Clean up all resources. Send audioStreamEnd to flush cached audio before closing. */
  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    captureCtxRef.current?.close().catch(() => {});
    clearPlayback();
    playbackCtxRef.current?.close().catch(() => {});
    try {
      sessionRef.current?.sendRealtimeInput?.({ audioStreamEnd: true });
      sessionRef.current?.close?.();
    } catch { /* ignore */ }
    streamRef.current = null;
    captureCtxRef.current = null;
    playbackCtxRef.current = null;
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
