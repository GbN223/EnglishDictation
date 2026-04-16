import { useState } from 'react';
import { useDictationStore } from '../store/dictationStore';
import {
  fetchYouTubeSubtitles,
  extractYouTubeVideoId,
  parseSubtitles,
} from '../services/youtubeSubtitles';
import {
  Youtube,
  Loader2,
  AlertCircle,
  Check,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface YouTubeSubtitleLoaderProps {
  onTextLoaded: (text: string) => void;
}

export default function YouTubeSubtitleLoader({ onTextLoaded }: YouTubeSubtitleLoaderProps) {
  const { selectedLanguage } = useDictationStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const handleLoadSubtitles = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      setLogs(['Validation failed: missing YouTube URL']);
      setShowLogs(true);
      return;
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      setLogs(['Validation failed: URL could not be parsed into a YouTube video ID']);
      setShowLogs(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setLogs([`Prepared video ID: ${videoId}`]);
    setShowLogs(true);

    try {
      const result = await fetchYouTubeSubtitles(videoId, selectedLanguage);
      setLogs(result.logs || []);
      console.groupCollapsed('YouTube extraction logs');
      (result.logs || []).forEach((entry) => console.log(entry));
      console.groupEnd();

      if (result.success && result.text.trim()) {
        onTextLoaded(result.text);
        setSuccess(true);
      } else {
        setError(
          result.error || 'Could not fetch subtitles. Try pasting subtitles manually.'
        );
      }
    } catch (err) {
      setError('Failed to load subtitles. Please try again or paste subtitles manually.');
      const fallbackLogs = [
        `Unhandled loader error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      ];
      setLogs(fallbackLogs);
      console.groupCollapsed('YouTube extraction logs');
      fallbackLogs.forEach((entry) => console.log(entry));
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubtitles = () => {
    if (pastedText.trim()) {
      onTextLoaded(parseSubtitles(pastedText));
      setSuccess(true);
      setPastedText('');
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setSuccess(false);
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Youtube className="h-4 w-4 text-red-500" />
        <span>Load from YouTube</span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
              if (success) setSuccess(false);
            }}
            placeholder="Paste YouTube URL here... (e.g., https://www.youtube.com/watch?v=...)"
            className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            aria-label="YouTube URL"
          />
          <button
            onClick={handleLoadSubtitles}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Youtube className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{loading ? 'Loading...' : 'Load'}</span>
          </button>
          {success && (
            <button
              onClick={handleClear}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
              aria-label="Clear"
            >
              <Check className="h-4 w-4 text-green-500" />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            ✓ Subtitles loaded successfully!
          </div>
        )}

        {logs.length > 0 && (
          <div className="rounded-lg border border-border bg-card/60">
            <button
              onClick={() => setShowLogs((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              <span>Extraction Logs ({logs.length})</span>
              {showLogs ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showLogs && (
              <div className="border-t border-border px-3 py-3">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-[11px] leading-5 text-foreground">
                  {logs.map((entry, index) => `${index + 1}. ${entry}`).join('\n')}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Paste subtitles fallback */}
        <div className="space-y-2">
          <button
            onClick={() => setShowPaste(!showPaste)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ClipboardPaste className="h-3 w-3" />
            {showPaste ? 'Hide' : 'Paste subtitles manually'} (SRT, VTT, or plain text)
          </button>

          {showPaste && (
            <div className="space-y-2">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste subtitles here (supports SRT, VTT, or plain text format)..."
                className="w-full min-h-[120px] rounded-lg border border-border bg-transparent p-3 text-xs font-mono outline-none resize-none placeholder:text-muted-foreground"
              />
              <button
                onClick={handlePasteSubtitles}
                disabled={!pastedText.trim()}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Use Pasted Text
              </button>
            </div>
          )}
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Supports: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., youtube.com/live/...
          <br />
          Language matches your selection. Auto-generated subtitles will be used if unavailable.
        </p>
      </div>
    </div>
  );
}
