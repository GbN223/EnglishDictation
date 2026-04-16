import { useRef, useEffect } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { Copy, Download, Share2, Trash2, Save } from 'lucide-react';

export default function Editor() {
  const { currentText, interimText, setCurrentText, clearText } = useDictationStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [currentText, interimText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictation-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share && currentText) {
      try {
        await navigator.share({
          title: 'Dictation Text',
          text: currentText,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    }
  };

  const handleSaveDraft = () => {
    // Handled by parent component
    const event = new CustomEvent('save-draft');
    window.dispatchEvent(event);
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">Transcription</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!currentText}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Copy text"
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!currentText}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Download as text file"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleShare}
            disabled={!currentText}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Share text"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={!currentText}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Save draft"
            title="Save Draft"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={clearText}
            disabled={!currentText}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
            aria-label="Clear all text"
            title="Clear"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="relative min-h-[400px] md:min-h-[500px]">
        <textarea
          ref={textareaRef}
          value={currentText + (interimText ? interimText : '')}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Start dictating or type here..."
          className="w-full h-full min-h-[400px] md:min-h-[500px] resize-none rounded-none border-0 bg-transparent p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground"
          aria-label="Dictation text editor"
          spellCheck
        />
        
        {/* Interim text indicator */}
        {interimText && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-accent/50 px-3 py-2 text-sm text-muted-foreground italic">
            Listening...
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {currentText.trim() ? currentText.trim().split(/\s+/).length : 0} words
        </span>
        <span className="hidden sm:inline">
          Tip: Use voice commands like "new paragraph", "comma", "period"
        </span>
      </div>
    </div>
  );
}
