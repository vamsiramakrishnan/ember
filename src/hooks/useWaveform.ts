/**
 * useWaveform — generates and draws a pseudo-waveform on a canvas.
 *
 * Decodes an audio blob URL into amplitude bars, then paints them
 * with a played/unplayed colour split. Quiet, warm palette.
 */
import { useRef, useEffect, useCallback } from 'react';
import { colors } from '@/tokens/colors';

const BAR_WIDTH = 2;
const BAR_GAP = 1;
const MIN_HEIGHT = 0.08;

/** Generate normalised amplitude bars from an AudioBuffer. */
function extractBars(buffer: AudioBuffer, count: number): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / count);
  const bars: number[] = [];
  let max = 0;

  for (let i = 0; i < count; i++) {
    let sum = 0;
    const start = i * step;
    for (let j = start; j < start + step && j < data.length; j++) {
      sum += Math.abs(data[j] ?? 0);
    }
    const avg = sum / step;
    bars.push(avg);
    if (avg > max) max = avg;
  }

  return bars.map((b) => Math.max(b / (max || 1), MIN_HEIGHT));
}

/** Paint bars onto a canvas with a progress split. */
function drawBars(
  ctx: CanvasRenderingContext2D,
  bars: number[],
  width: number,
  height: number,
  progress: number,
  dpr: number,
) {
  ctx.clearRect(0, 0, width * dpr, height * dpr);
  const barStep = BAR_WIDTH + BAR_GAP;
  const progressX = progress * width * dpr;

  for (let i = 0; i < bars.length; i++) {
    const x = i * barStep * dpr;
    const barH = (bars[i] ?? MIN_HEIGHT) * height * 0.85 * dpr;
    const y = (height * dpr - barH) / 2;

    ctx.fillStyle = x < progressX ? colors.margin : colors.inkGhost;
    ctx.fillRect(x, y, BAR_WIDTH * dpr, barH);
  }
}

export function useWaveform(audioUrl: string | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const progressRef = useRef(0);
  const rafRef = useRef(0);

  // Decode audio and extract bars
  useEffect(() => {
    if (!audioUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const abortCtrl = new AbortController();
    const ctx = new AudioContext();
    fetch(audioUrl, { signal: abortCtrl.signal })
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        if (abortCtrl.signal.aborted) return;
        const rect = canvas.getBoundingClientRect();
        const count = Math.floor(rect.width / (BAR_WIDTH + BAR_GAP));
        barsRef.current = extractBars(decoded, count);
        drawOnCanvas();
      })
      .catch(() => {
        if (abortCtrl.signal.aborted) return;
        // Fallback: random bars if decode fails
        const rect = canvas.getBoundingClientRect();
        const count = Math.floor(rect.width / (BAR_WIDTH + BAR_GAP));
        barsRef.current = Array.from({ length: count }, () =>
          Math.max(Math.random() * 0.6 + 0.15, MIN_HEIGHT),
        );
        drawOnCanvas();
      });

    return () => { abortCtrl.abort(); void ctx.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const drawOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || barsRef.current.length === 0) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    drawBars(ctx2d, barsRef.current, rect.width, rect.height, progressRef.current, dpr);
  }, []);

  const updateProgress = useCallback((p: number) => {
    progressRef.current = p;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawOnCanvas);
  }, [drawOnCanvas]);

  const getProgressFromClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  return { canvasRef, updateProgress, getProgressFromClick, redraw: drawOnCanvas };
}
