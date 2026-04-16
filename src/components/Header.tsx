import { useDictationStore } from '../store/dictationStore';
import { Mic, Sun, Moon, FileText, Monitor, Headphones } from 'lucide-react';

export default function Header() {
  const { isDarkMode, toggleDarkMode, appMode, setAppMode } = useDictationStore();

  const isPracticeMode = appMode === 'practice';

  const toggleMode = () => {
    setAppMode(isPracticeMode ? 'dictation' : 'practice');
  };

  const wordCount = useDictationStore.getState().currentText.trim()
    ? useDictationStore.getState().currentText.trim().split(/\s+/).length
    : 0;
  const charCount = useDictationStore.getState().currentText.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">VoiceDictation</span>
            <span className="text-xs text-muted-foreground hidden sm:block">Multilingual Speech-to-Text</span>
          </div>
        </div>

        {/* Mode toggle */}
        <button
          onClick={toggleMode}
          className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
            isPracticeMode ? 'bg-primary/10 text-primary' : ''
          }`}
          aria-label={isPracticeMode ? 'Switch to dictation mode' : 'Switch to practice mode'}
        >
          {isPracticeMode ? (
            <>
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Dictation</span>
            </>
          ) : (
            <>
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Practice</span>
            </>
          )}
        </button>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>{wordCount} words</span>
            </div>
            <span>{charCount} chars</span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
