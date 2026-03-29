/**
 * PodcastPlayer — SoundCloud-style audio player for AI-generated podcasts.
 * Renders a waveform visualisation with play/pause, scrub, time, and
 * a collapsible transcript. Supports multi-segment playback: segments
 * play sequentially, auto-advancing as each completes.
 *
 * Fixed: audio element is always mounted so ref is stable; playback
 * resumes correctly when segments arrive after initial render; error
 * and loading states prevent silent failures.
 *
 * See: podcast-gen.ts for the generation pipeline.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useWaveform } from '@/hooks/useWaveform';
import { revokeTtsUrl } from '@/services/tts-synthesize';
import styles from './PodcastPlayer.module.css';

interface PodcastPlayerProps {
  topic: string;
  audioUrl: string;
  segments?: string[];
  transcript: string;
  duration?: number;
  coverUrl?: string;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PodcastPlayer({
  topic, audioUrl, segments, transcript, coverUrl,
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
  const [audioError, setAudioError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Track previous hasAudio to detect when audio first becomes available
  const prevHasAudioRef = useRef(hasAudio);

  // Clamp segIndex to valid range when playlist shrinks/changes
  const safeSegIndex = Math.min(segIndex, Math.max(playlist.length - 1, 0));
  const currentUrl = playlist[safeSegIndex] ?? '';
  const { canvasRef, updateProgress, getProgressFromClick, redraw } =
    useWaveform(currentUrl || null);

  // When audio first becomes available (transition from no-audio to has-audio),
  // collapse transcript and reset state
  useEffect(() => {
    if (hasAudio && !prevHasAudioRef.current) {
      setShowTranscript(false);
      setAudioError(null);
      setSegIndex(0);
    }
    prevHasAudioRef.current = hasAudio;
  }, [hasAudio]);

  // Revoke blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      for (const url of playlist) {
        if (url.startsWith('blob:')) revokeTtsUrl(url);
      }
    };
  // Only clean up on unmount, not on playlist changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach audio event listeners. The audio element is always mounted,
  // so audioRef.current is always available.
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
        setLoading(false);
      }
    };
    const onEnd = () => {
      if (safeSegIndex < playlist.length - 1) {
        setSegIndex((i) => i + 1);
      } else {
        setPlaying(false);
        updateProgress(0);
      }
    };
    const onError = () => {
      setLoading(false);
      if (audio.src && audio.src !== window.location.href) {
        setAudioError('Audio could not be loaded. The recording may have expired.');
        setPlaying(false);
      }
    };
    const onCanPlay = () => {
      setLoading(false);
      setAudioError(null);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [updateProgress, safeSegIndex, playlist.length]);

  // When segment changes or a new URL arrives, load the audio.
  // This is the critical path: it must fire when currentUrl changes
  // (including the first time audio becomes available).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;

    // Only reload if the source actually changed
    if (audio.src === currentUrl) return;

    setAudioError(null);
    setLoading(true);
    audio.src = currentUrl;
    audio.load();
    if (playing) {
      void audio.play().catch(() => {
        // Autoplay may be blocked by browser policy — user must click play
        setPlaying(false);
      });
    }
  }, [currentUrl, playing]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;

    // Ensure src is set (handles race where toggle fires before load effect)
    if (!audio.src || audio.src === window.location.href) {
      audio.src = currentUrl;
      audio.load();
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setAudioError(null);
      setLoading(true);
      void audio.play()
        .then(() => { setPlaying(true); setLoading(false); })
        .catch((err) => {
          setLoading(false);
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            setAudioError('Tap play again — your browser blocked autoplay.');
          } else {
            setAudioError('Could not play audio.');
          }
        });
    }
  }, [playing, currentUrl]);

  const seek = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const p = getProgressFromClick(e);
    audio.currentTime = p * audio.duration;
    updateProgress(p);
  }, [getProgressFromClick, updateProgress]);

  // Redraw waveform on resize
  useEffect(() => {
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [redraw]);

  const timeLabel = totalDuration > 0
    ? `${formatTime(currentTime)} / ${formatTime(totalDuration)}`
    : formatTime(currentTime);

  const segLabel = playlist.length > 1
    ? ` · part ${safeSegIndex + 1}/${playlist.length}` : '';

  return (
    <div className={styles.container}>
      {/* Always mount audio element so ref is stable across re-renders */}
      <audio ref={audioRef} preload="metadata" />
      <div className={styles.headerRow}>
        {coverUrl && (
          <img
            className={styles.cover}
            src={coverUrl}
            alt={`Cover art for ${topic}`}
            loading="lazy"
          />
        )}
        <div className={styles.headerText}>
          <div className={styles.label}>
            {hasAudio ? `podcast${segLabel}` : 'podcast transcript'}
          </div>
          <h3 className={styles.topic}>{topic}</h3>
        </div>
      </div>

      {hasAudio && <div className={styles.controls}>
        <button
          className={`${styles.playButton} ${playing ? styles.playButtonActive : ''}`}
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          disabled={loading}
        >
          {loading ? LoadingIcon : playing ? PauseIcon : PlayIcon}
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

      {!hasAudio && (
        <div className={styles.pendingRow}>
          <span className={styles.pendingDot} />
          <span className={styles.pendingLabel}>synthesizing audio…</span>
        </div>
      )}

      {audioError && (
        <p className={styles.error}>{audioError}</p>
      )}

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
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <path d="M3 1.5v11l9-5.5z" />
  </svg>
);

const PauseIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" />
    <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" />
  </svg>
);

const LoadingIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
    strokeWidth="1.5" aria-hidden="true" className={styles.spinner}>
    <circle cx="7" cy="7" r="5" strokeDasharray="20 12" />
  </svg>
);
