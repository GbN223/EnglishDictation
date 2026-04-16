import { useState } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { TRANSLATION_LANGUAGES } from '../config/languages';
import { X, Loader2, Globe } from 'lucide-react';

interface TranslationModalProps {
  onClose: () => void;
}

export default function TranslationModal({ onClose }: TranslationModalProps) {
  const { currentText, setCurrentText, selectedLanguage } = useDictationStore();
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!currentText.trim()) {
      setError('No text to translate');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      // Using MyMemory Translation API (free, no API key required)
      // For production, consider Google Cloud Translation, DeepL, or similar
      const sourceLang = selectedLanguage.split('-')[0];
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          currentText.substring(0, 500) // API limit
        )}&langpair=${sourceLang}|${targetLang}`
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        throw new Error(data.responseDetails || 'Translation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReplace = () => {
    if (translatedText) {
      setCurrentText(translatedText);
      onClose();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Translate Text</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Close translation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6">
          {/* Language selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Translate to:</label>
            <div className="flex flex-wrap gap-2">
              {TRANSLATION_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setTargetLang(lang.code)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    targetLang === lang.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !currentText.trim()}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isTranslating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating...
              </span>
            ) : (
              'Translate'
            )}
          </button>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Translated text */}
          {translatedText && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Translation:</label>
              <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-accent/50 p-4">
                <p className="whitespace-pre-wrap text-sm">{translatedText}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={handleReplace}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Replace Original
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
