import { useState, useEffect, useCallback, useRef } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { useShadowRecognition } from '../hooks/useShadowRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { calculateAccuracy, getScoreCategory, compareWords } from '../utils/levenshtein';
import { getLanguage } from '../config/languages';
import { Mic, MicOff, Play, Square, RotateCcw, Volume2, CheckCircle, AlertCircle } from 'lucide-react';

// Sample texts for shadow reading practice
const SHADOW_TEXTS = {
  Easy: [
    'The cat sat on the mat.',
    'I like to drink tea in the morning.',
    'She went to the store yesterday.',
    'He is reading a good book.',
    'We had lunch at noon today.',
  ],
  Medium: [
    'The weather forecast predicts rain tomorrow, so remember to bring an umbrella.',
    'She decided to learn a new language because she loves traveling abroad.',
    'The meeting has been rescheduled to next Wednesday at two thirty PM.',
    'Please send me the report by the end of the day, if possible.',
    'I would like to order a cheese pizza with extra toppings, thank you.',
  ],
  Hard: [
    'The unprecedented circumstances necessitate immediate attention and comprehensive action from all stakeholders involved.',
    'Notwithstanding the aforementioned considerations, it remains imperative that we proceed with due diligence and caution.',
    'The socioeconomic implications of this phenomenon have been extensively debated among academics and policymakers alike.',
    'Her elucidation of the complex theoretical framework demonstrated remarkable intellectual sophistication and clarity.',
    'The juxtaposition of contrasting ideologies in contemporary discourse reflects the multifaceted nature of our society.',
  ],
};

type Difficulty = 'Easy' | 'Medium' | 'Hard';

export default function ShadowReader() {
  const {
    selectedLanguage,
    shadowTargetText,
    shadowSpokenText,
    shadowAccuracy,
    shadowSessions,
    shadowInterimTranscript,
    shadowAutoStartDelay,
    setShadowTargetText,
    setShadowSpokenText,
    setShadowAccuracy,
    addShadowSession,
    clearShadowSession,
    setShadowInterimTranscript,
  } = useDictationStore();

  const { speak, stop, isSupported: ttsSupported, isPlaying, audioRef } = useTextToSpeech();
  
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [isListening, setIsListening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wordComparison, setWordComparison] = useState<Array<{
    word: string;
    isMatch: boolean;
    isExtra: boolean;
    isMissing: boolean;
  }>>([]);
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition hook
  const [{ 
    interimTranscript, 
    finalTranscript, 
    error: recognitionError,
    isSupported: srSupported 
  }, { 
    startListening: startRecognition, 
    stopListening: stopRecognition,
    reset: resetRecognition 
  }] = useShadowRecognition({
    lang: getLanguage(selectedLanguage)?.speechCode || 'en-US',
    onResult: (transcript) => {
      // Final transcript received
      handleFinalTranscript(transcript);
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setIsListening(false);
    },
  });

  // Update interim transcript in store
  useEffect(() => {
    if (interimTranscript) {
      setShadowInterimTranscript(interimTranscript);
    }
  }, [interimTranscript, setShadowInterimTranscript]);

  // Handle final transcript and calculate accuracy
  const handleFinalTranscript = useCallback((transcript: string) => {
    if (!shadowTargetText.trim()) return;

    setShadowSpokenText(transcript);
    
    // Calculate accuracy using Levenshtein distance
    const accuracy = calculateAccuracy(transcript, shadowTargetText);
    setShadowAccuracy(accuracy);
    
    // Generate word-by-word comparison
    const comparison = compareWords(transcript, shadowTargetText);
    setWordComparison(comparison);
    
    // Show results
    setShowResult(true);
    setIsListening(false);
    
    // Add session to history
    const scoreCategory = getScoreCategory(accuracy);
    addShadowSession({
      id: Math.random().toString(36).substring(2, 11),
      targetText: shadowTargetText,
      spokenText: transcript,
      accuracy,
      timestamp: Date.now(),
      language: selectedLanguage,
      scoreCategory: scoreCategory.category,
    });
  }, [shadowTargetText, selectedLanguage, setShadowSpokenText, setShadowAccuracy, addShadowSession]);

  // Start shadowing session
  const handleStartShadowing = useCallback(() => {
    // Get or set target text
    let targetText = shadowTargetText;
    if (!targetText.trim()) {
      const currentTexts = SHADOW_TEXTS[difficulty];
      targetText = currentTexts[Math.floor(Math.random() * currentTexts.length)];
      setShadowTargetText(targetText);
    }

    // Reset state
    clearShadowSession();
    setShowResult(false);
    setWordComparison([]);
    setHasStarted(true);

    // Play audio
    speak(targetText);

    // Auto-start speech recognition after delay
    autoStartTimeoutRef.current = setTimeout(() => {
      startRecognition();
      setIsListening(true);
    }, shadowAutoStartDelay);
  }, [
    shadowTargetText, 
    difficulty, 
    setShadowTargetText, 
    clearShadowSession, 
    speak, 
    startRecognition,
    shadowAutoStartDelay,
  ]);

  // Stop shadowing session
  const handleStopShadowing = useCallback(() => {
    stop();
    stopRecognition();
    setIsListening(false);
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
  }, [stop, stopRecognition]);

  // New practice session
  const handleNewPractice = useCallback(() => {
    handleStopShadowing();
    clearShadowSession();
    setShowResult(false);
    setWordComparison([]);
    setHasStarted(false);
    
    const currentTexts = SHADOW_TEXTS[difficulty];
    const newText = currentTexts[Math.floor(Math.random() * currentTexts.length)];
    setShadowTargetText(newText);
  }, [handleStopShadowing, clearShadowSession, difficulty, setShadowTargetText]);

  // Manual microphone toggle
  const handleToggleMic = useCallback(() => {
    if (isListening) {
      stopRecognition();
      setIsListening(false);
    } else {
      startRecognition();
      setIsListening(true);
    }
  }, [isListening, startRecognition, stopRecognition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
    };
  }, []);

  // Get score category for display
  const scoreCategory = shadowAccuracy !== null ? getScoreCategory(shadowAccuracy) : null;

  // Check browser support
  const isSupported = ttsSupported && srSupported;

  return (
    <div className="space-y-6">
      {/* Browser compatibility warning */}
      {!isSupported && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>Shadow Mode requires Chrome, Edge, or Safari. Speech recognition is not supported in your browser.</span>
        </div>
      )}

      {/* Header with mode selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shadow Reading Mode</h2>
          <p className="text-sm text-muted-foreground">
            Listen and speak along simultaneously to improve pronunciation
          </p>
        </div>

        <button
          onClick={handleNewPractice}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          New Practice
        </button>
      </div>

      {/* Setup panel - shown when no active session */}
      {!hasStarted && !shadowTargetText && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h3 className="text-lg font-semibold">Set Up Shadow Reading Session</h3>

          {/* Difficulty selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level:</label>
            <div className="flex gap-2">
              {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    difficulty === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent hover:bg-accent/80'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartShadowing}
            disabled={!isSupported}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Start Shadow Reading
          </button>
        </div>
      )}

      {/* Active session */}
      {(hasStarted || shadowTargetText) && (
        <>
          {/* Target text display with word highlighting */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Target Text</h3>
              <span className="text-xs text-muted-foreground">
                Difficulty: {difficulty}
              </span>
            </div>

            {/* Word-by-word display */}
            <div className="rounded-lg bg-accent/50 p-4 leading-relaxed">
              {showResult && wordComparison.length > 0 ? (
                // Show comparison with colored words
                <div className="flex flex-wrap gap-1">
                  {wordComparison.map((item, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-sm ${
                        item.isMatch
                          ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                          : item.isMissing
                          ? 'bg-red-500/20 text-red-700 dark:text-red-300 line-through'
                          : item.isExtra
                          ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                          : 'bg-orange-500/20 text-orange-700 dark:text-orange-300'
                      }`}
                      title={item.isExtra || item.isMissing || (!item.isMatch && !item.isExtra && !item.isMissing) 
                        ? item.word 
                        : undefined}
                    >
                      {item.word.split(' → ')[0]}
                      {(!item.isMatch && !item.isExtra && !item.isMissing) && (
                        <span className="text-xs ml-1">→ {item.word.split(' → ')[1]}</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                // Show original text
                <p className="text-sm">{shadowTargetText}</p>
              )}
            </div>

            {/* Audio controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={isPlaying ? stop : () => speak(shadowTargetText)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <Square className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </button>
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isPlaying ? 'Playing...' : 'Listen to pronunciation'}
              </span>
            </div>
          </div>

          {/* Microphone and recording section */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Pronunciation</h3>
              {isListening && (
                <span className="flex items-center gap-2 text-sm text-red-500">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Recording...
                </span>
              )}
            </div>

            {/* Microphone button */}
            <div className="flex justify-center py-4">
              <button
                onClick={handleToggleMic}
                disabled={!isSupported}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
            </div>

            {/* Live transcription */}
            {(interimTranscript || finalTranscript || shadowInterimTranscript) && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Live Transcription:</label>
                <div className="rounded-lg bg-muted p-3 min-h-[60px]">
                  <p className="text-sm">
                    <span className="text-muted-foreground">{interimTranscript || shadowInterimTranscript}</span>
                    {finalTranscript && (
                      <span className="block mt-1 text-foreground font-medium">{finalTranscript}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {recognitionError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{recognitionError}</span>
              </div>
            )}
          </div>

          {/* Results section */}
          {showResult && shadowAccuracy !== null && scoreCategory && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pronunciation Score</h3>
                <CheckCircle className={`h-5 w-5 ${scoreCategory.color}`} />
              </div>

              {/* Score badge */}
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${scoreCategory.color}`}>
                  {shadowAccuracy}%
                </div>
                <div className="space-y-1">
                  <div className={`text-lg font-medium ${scoreCategory.color}`}>
                    {scoreCategory.label}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shadowAccuracy >= 90
                      ? 'Excellent pronunciation! Keep it up!'
                      : shadowAccuracy >= 70
                      ? 'Good job! A bit more practice will help.'
                      : 'Keep practicing! Try to match the sounds more closely.'}
                  </p>
                </div>
              </div>

              {/* Detailed comparison */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Word-by-Word Comparison:</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500/20"></span>
                    <span className="text-muted-foreground">Correct</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500/20"></span>
                    <span className="text-muted-foreground">Missing</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-yellow-500/20"></span>
                    <span className="text-muted-foreground">Extra</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-orange-500/20"></span>
                    <span className="text-muted-foreground">Different</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleNewPractice}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Try Another
                </button>
                <button
                  onClick={handleStartShadowing}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Retry Same Text
                </button>
              </div>
            </div>
          )}

          {/* Start button if not started yet */}
          {!hasStarted && shadowTargetText && (
            <button
              onClick={handleStartShadowing}
              disabled={!isSupported}
              className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Start Shadow Reading
            </button>
          )}
        </>
      )}

      {/* Session history */}
      {shadowSessions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Recent Sessions</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {shadowSessions.slice(0, 5).map((session) => {
              const category = getScoreCategory(session.accuracy);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{session.targetText}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${category.color}`}>
                    {session.accuracy}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
