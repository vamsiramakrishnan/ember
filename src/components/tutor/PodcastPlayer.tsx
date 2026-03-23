/**
 * PodcastPlayer — SoundCloud-style audio player for AI-generated podcasts.
 * Renders a waveform visualisation with play/pause, scrub, time, and
 * a collapsible transcript. Supports multi-segment playback: segments
 * play sequentially, auto-advancing as each completes.
 *
 * See: podcast-gen.ts for the generation pipeline.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import styles from './PodcastPlayer.module.css';

interface PodcastPlayerProps {
  topic: string;
  audioUrl: string;
  segments?: string[];
  transcript: string;
  duration?: number;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PodcastPlayer({
  topic, audioUrl, segments, transcript,
}: PodcastPlayerProps) {
  // Build the full playlist: first segment is audioUrl, rest from segments[]
  const playlist = [audioUrl, ...(segments ?? [])].filter(Boolean);
  const hasAudio = playlist.length > 0;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [segIndex, setSegIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(!hasAudio);

  const currentUrl = playlist[segIndex] ?? '';
  const { canvasRef, updateProgress, getProgressFromClick } =
    useWaveform(currentUrl || null);

  // Auto-advance to next segment when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
        updateProgress(audio.currentTime / audio.duration);
      }
    };
    const onMeta = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnd = () => {
      if (segIndex < playlist.length - 1) {
        setSegIndex((i) => i + 1);
      } else {
        setPlaying(false);
        updateProgress(0);
      }
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, [updateProgress, segIndex, playlist.length]);

  // When segment changes, load + autoplay the new segment
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    audio.src = currentUrl;
    audio.load();
    if (playing) void audio.play();
  }, [segIndex, currentUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); } else { void audio.play(); }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const p = getProgressFromClick(e);
    audio.currentTime = p * audio.duration;
    updateProgress(p);
  }, [getProgressFromClick, updateProgress]);

  const timeLabel = totalDuration > 0
    ? `${formatTime(currentTime)} / ${formatTime(totalDuration)}`
    : formatTime(currentTime);

  const segLabel = playlist.length > 1
    ? ` · part ${segIndex + 1}/${playlist.length}` : '';

  return (
    <div className={styles.container}>
      {hasAudio && <audio ref={audioRef} src={currentUrl} preload="metadata" />}
      <div className={styles.label}>
        {hasAudio ? `podcast${segLabel}` : 'podcast transcript'}
      </div>
      <h3 className={styles.topic}>{topic}</h3>

      {hasAudio && <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? PauseIcon : PlayIcon}
        </button>
        <div className={styles.waveformWrap}>
          <canvas
            ref={canvasRef}
            className={styles.waveformCanvas}
            onClick={seek}
            role="slider"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              totalDuration ? Math.round((currentTime / totalDuration) * 100) : 0
            }
          />
        </div>
        <span className={styles.time}>{timeLabel}</span>
      </div>}

      <button
        className={styles.transcriptToggle}
        onClick={() => setShowTranscript(!showTranscript)}
      >
        {showTranscript ? 'hide transcript' : 'show transcript'}
      </button>
      {showTranscript && (
        <div className={styles.transcript}>{transcript}</div>
      )}
    </div>
  );
}

const PlayIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <path d="M3 1.5v11l9-5.5z" />
  </svg>
);

const PauseIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" />
    <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" />
  </svg>
);
