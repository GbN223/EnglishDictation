import { useDictationStore } from '../store/dictationStore';
import { Mic, MicOff, Pause, Square, Play, Repeat } from 'lucide-react';

export default function Controls() {
  const {
    dictationStatus,
    setDictationStatus,
    continuousMode,
    toggleContinuousMode,
  } = useDictationStore();

  const isListening = dictationStatus === 'listening';
  const isPaused = dictationStatus === 'paused';

  const handleStart = () => {
    const event = new CustomEvent('dictation-start');
    window.dispatchEvent(event);
  };

  const handlePause = () => {
    const event = new CustomEvent('dictation-pause');
    window.dispatchEvent(event);
  };

  const handleResume = () => {
    const event = new CustomEvent('dictation-resume');
    window.dispatchEvent(event);
  };

  const handleStop = () => {
    const event = new CustomEvent('dictation-stop');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main control button */}
      <div className="flex items-center gap-3">
        {/* Start/Pause/Resume button */}
        {!isListening && !isPaused && (
          <button
            onClick={handleStart}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            aria-label="Start dictation"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" />
            <Mic className="h-8 w-8" />
          </button>
        )}

        {isListening && (
          <>
            <button
              onClick={handlePause}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
              aria-label="Pause dictation"
            >
              <Pause className="h-7 w-7" />
            </button>
            <button
              onClick={handleStop}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              aria-label="Stop dictation"
            >
              <Square className="h-7 w-7 fill-current" />
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={handleResume}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label="Resume dictation"
            >
              <Play className="h-7 w-7 fill-current" />
            </button>
            <button
              onClick={handleStop}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              aria-label="Stop dictation"
            >
              <Square className="h-7 w-7 fill-current" />
            </button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {isListening && (
          <div className="flex items-center gap-1.5">
            <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Listening...</span>
          </div>
        )}
        {isPaused && (
          <div className="flex items-center gap-1.5">
            <div className="flex h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Paused</span>
          </div>
        )}
        {!isListening && !isPaused && (
          <span className="text-sm text-muted-foreground">Tap microphone to start</span>
        )}
      </div>

      {/* Continuous mode toggle */}
      <button
        onClick={toggleContinuousMode}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
          continuousMode
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
        aria-label={continuousMode ? 'Disable continuous mode' : 'Enable continuous mode'}
      >
        <Repeat className={`h-3.5 w-3.5 ${continuousMode ? 'animate-pulse' : ''}`} />
        <span>Continuous</span>
      </button>
    </div>
  );
}
