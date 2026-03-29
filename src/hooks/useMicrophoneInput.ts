/**
 * useMicrophoneInput — records audio from the user's microphone
 * and transcribes it via Gemini.
 *
 * States: idle → recording → transcribing → idle
 * The MediaRecorder captures audio as webm/opus chunks.
 * On stop, chunks are assembled into a blob, converted to base64,
 * and sent to Gemini for transcription.
 */
import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '@/services/audio-transcribe';

export type MicState = 'idle' | 'recording' | 'transcribing';

export function useMicrophoneInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<MicState>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) {
          setState('idle');
          return;
        }

        setState('transcribing');
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const base64 = await blobToBase64(blob);
          const transcript = await transcribeAudio(base64, mimeType);
          if (transcript.trim()) {
            onTranscript(transcript.trim());
          } else {
            setError('No speech detected. Try again.');
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Transcription failed';
          setError(msg);
        } finally {
          setState('idle');
        }
      };

      recorder.start(1000); // Capture in 1-second chunks
      setState('recording');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(msg);
      setState('idle');
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      await startRecording();
    }
    // If transcribing, ignore toggle
  }, [state, startRecording, stopRecording]);

  return { state, error, toggleRecording, stopRecording };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix: "data:audio/webm;base64,..."
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
