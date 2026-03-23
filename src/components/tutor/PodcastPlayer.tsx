/**
 * PodcastPlayer — SoundCloud-style audio player for AI-generated podcasts.
 * Renders a waveform visualisation with play/pause, scrub, time, and
 * a collapsible transcript. Quiet notebook aesthetic.
 *
 * See: podcast-gen.ts for the generation pipeline.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import styles from './PodcastPlayer.module.css';

interface PodcastPlayerProps {
  topic: string;
  audioUrl: string;
  transcript: string;
  duration?: number;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PodcastPlayer({ topic, audioUrl, transcript }: PodcastPlayerProps) {
  const hasAudio = audioUrl.length > 0;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(!hasAudio);
  const { canvasRef, updateProgress, getProgressFromClick } = useWaveform(hasAudio ? audioUrl : null);

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
    const onEnd = () => { setPlaying(false); updateProgress(0); };

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
  }, [updateProgress]);

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

  return (
    <div className={styles.container}>
      {hasAudio && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
      <div className={styles.label}>{hasAudio ? 'podcast' : 'podcast transcript'}</div>
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
            aria-valuenow={totalDuration ? Math.round((currentTime / totalDuration) * 100) : 0}
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
