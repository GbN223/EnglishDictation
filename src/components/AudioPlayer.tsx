import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Rewind,
  FastForward,
} from 'lucide-react';

const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface AudioPlayerProps {
  audioUrl?: string;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasUrl = Boolean(audioUrl?.trim());

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !hasUrl) return;

    setLoadState('loading');
    setErrorMessage(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    el.load();

    const onLoadedMetadata = () => {
      setDuration(el.duration || 0);
      setLoadState('ready');
    };

    const onCanPlay = () => {
      setLoadState('ready');
    };

    const onTimeUpdate = () => {
      if (!seekingRef.current) {
        setCurrentTime(el.currentTime);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
      setCurrentTime(el.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setLoadState('error');
      setErrorMessage('Could not load audio. Check the URL or your connection.');
      setIsPlaying(false);
    };

    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [audioUrl, hasUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || loadState === 'error' || loadState === 'loading') return;
    if (isPlaying) {
      el.pause();
    } else {
      void el.play().catch(() => {
        setErrorMessage('Playback was blocked or failed.');
        setLoadState('error');
      });
    }
  };

  const handleSeekStart = () => {
    seekingRef.current = true;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    const el = audioRef.current;
    if (!el || !Number.isFinite(next)) return;
    setCurrentTime(next);
    el.currentTime = next;
  };

  const handleSeekEnd = () => {
    seekingRef.current = false;
    const el = audioRef.current;
    if (el) setCurrentTime(el.currentTime);
  };

  const skipBy = (delta: number) => {
    const el = audioRef.current;
    if (!el || loadState !== 'ready') return;
    const next = Math.min(
      Math.max(0, el.currentTime + delta),
      duration || el.duration || Infinity
    );
    el.currentTime = next;
    setCurrentTime(next);
  };

  const cycleSpeed = () => {
    setPlaybackRate((prev) => {
      const idx = PLAYBACK_RATES.findIndex((r) => Math.abs(r - prev) < 0.001);
      return PLAYBACK_RATES[(idx >= 0 ? idx + 1 : 1) % PLAYBACK_RATES.length];
    });
  };

  const speedLabel = (() => {
    const r = playbackRate;
    if (Math.abs(r - 0.75) < 0.01) return '0.75x';
    if (Math.abs(r - 1.0) < 0.01) return '1.0x';
    if (Math.abs(r - 1.25) < 0.01) return '1.25x';
    if (Math.abs(r - 1.5) < 0.01) return '1.5x';
    return `${r}x`;
  })();

  if (!hasUrl) {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        No audio URL for this exercise. Paste or generate audio to enable playback.
      </div>
    );
  }

  const disabled = loadState === 'error' || loadState === 'loading';
  const maxDuration = duration > 0 ? duration : 100;

  return (
    <div className="rounded-lg border border-border bg-card/80 px-3 py-3 shadow-sm sm:px-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

      {errorMessage && (
        <div className="mb-2 flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-center gap-1 sm:justify-start">
          <button
            type="button"
            onClick={() => skipBy(-5)}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            aria-label="Rewind 5 seconds"
          >
            <Rewind className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {loadState === 'loading' ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 fill-current" aria-hidden />
            ) : (
              <Play className="h-5 w-5 fill-current pl-0.5" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipBy(5)}
            disabled={disabled}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
            aria-label="Forward 5 seconds"
          >
            <FastForward className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <input
            type="range"
            min={0}
            max={maxDuration}
            step={0.1}
            value={Math.min(currentTime, maxDuration)}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onChange={handleSeekChange}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            onBlur={handleSeekEnd}
            disabled={disabled || duration <= 0}
            className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Seek audio position"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
          <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-end">
          <button
            type="button"
            onClick={cycleSpeed}
            disabled={disabled}
            className="min-w-[3.5rem] rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium tabular-nums text-foreground transition-colors hover:bg-accent disabled:opacity-40"
            aria-label={`Playback speed ${playbackRate}x, click to change`}
          >
            {speedLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
