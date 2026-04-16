import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import Controls from './components/Controls';
import Editor from './components/Editor';
import ConfidenceIndicator from './components/ConfidenceIndicator';
import VoiceWaveform from './components/VoiceWaveform';
import DraftsManager from './components/DraftsManager';
import PracticeMode from './components/PracticeMode';
import TranslationModal from './components/TranslationModal';
import ErrorDialog from './components/ErrorDialog';
import YouTubeSubtitleLoader from './components/YouTubeSubtitleLoader';
import { Toast, useToast } from './components/Toast';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useDictationStore } from './store/dictationStore';
import { getLanguage } from './config/languages';
import { Languages, BookOpen, Info } from 'lucide-react';

export default function App() {
  const {
    selectedLanguage,
    dictationStatus,
    errorMessage,
    setErrorMessage,
    currentText,
    setCurrentText,
    addDraft,
    drafts,
    appMode,
  } = useDictationStore();

  useSpeechRecognition();
  const { toast, showToast, hideToast } = useToast();

  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  const currentLang = getLanguage(selectedLanguage);
  const isListening = dictationStatus === 'listening';
  const isPracticeMode = appMode === 'practice';

  // Handle save draft event
  useEffect(() => {
    const handleSaveDraft = () => {
      if (!currentText.trim()) {
        showToast('No text to save', 'error');
        return;
      }

      // Check for duplicates
      const existingDraft = drafts.find(
        (d) => d.content === currentText.trim()
      );

      if (existingDraft) {
        showToast('Draft already exists', 'info');
        return;
      }

      const draft = {
        id: Math.random().toString(36).substring(2, 11),
        content: currentText.trim(),
        language: selectedLanguage,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        wordCount: currentText.trim().split(/\s+/).length,
      };

      addDraft(draft);
      showToast('Draft saved successfully', 'success');
    };

    window.addEventListener('save-draft', handleSaveDraft);
    return () => window.removeEventListener('save-draft', handleSaveDraft);
  }, [currentText, selectedLanguage, drafts, addDraft, showToast]);

  // Show error dialog when there's an error
  useEffect(() => {
    if (errorMessage) {
      setShowErrorDialog(true);
    }
  }, [errorMessage]);

  const handleCloseError = useCallback(() => {
    setShowErrorDialog(false);
    setErrorMessage(null);
  }, [setErrorMessage]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Language selector - always visible */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <LanguageSelector />
              {!isPracticeMode && <VoiceWaveform isActive={isListening} />}
            </div>

            <div className="flex items-center gap-2">
              {!isPracticeMode && (
                <>
                  <button
                    onClick={() => setShowTranslationModal(true)}
                    disabled={!currentText.trim()}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                    aria-label="Translate text"
                  >
                    <Languages className="h-4 w-4" />
                    <span className="hidden sm:inline">Translate</span>
                  </button>
                  <button
                    onClick={() => setShowDrafts(!showDrafts)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors"
                    aria-label="View drafts"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Drafts</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Practice Mode */}
          {isPracticeMode ? (
            <PracticeMode />
          ) : (
            <>
              {/* Dictation Mode Controls */}
              <div className="flex justify-center py-4">
                <Controls />
              </div>

              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <YouTubeSubtitleLoader
                  onTextLoaded={(text) => {
                    setCurrentText(text);
                    showToast('Text loaded from YouTube', 'success');
                  }}
                />
              </div>

              {/* Editor */}
              <Editor />

              {/* Bottom row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ConfidenceIndicator />

                {/* Voice commands hint */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">
                    Voice commands work when listening. Try: "new paragraph", "comma", "period"
                  </span>
                  <span className="sm:hidden">
                    Use voice commands while dictating
                  </span>
                </div>
              </div>

              {/* Drafts */}
              {showDrafts && <DraftsManager />}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          {isPracticeMode ? (
            <p>
              Practice Mode: Listen, speak/type, and check your accuracy
            </p>
          ) : (
            <>
              <p>
                Built with Web Speech API • Works best in Chrome, Edge, and Safari
              </p>
              <p className="mt-1">
                For offline support or enhanced accuracy, integrate Whisper API
              </p>
            </>
          )}
        </div>
      </footer>

      {/* Modals */}
      {showTranslationModal && (
        <TranslationModal onClose={() => setShowTranslationModal(false)} />
      )}

      {showErrorDialog && errorMessage && (
        <ErrorDialog
          title="Dictation Error"
          message={errorMessage}
          onClose={handleCloseError}
          action={
            errorMessage.includes('permission')
              ? {
                  label: 'Check Permissions',
                  onClick: () => {
                    window.open(
                      'chrome://settings/content/microphone',
                      '_blank'
                    );
                  },
                }
              : undefined
          }
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
