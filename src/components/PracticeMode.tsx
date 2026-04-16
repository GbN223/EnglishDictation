import { useEffect, useState } from 'react';
import { useDictationStore } from '../store/dictationStore';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import YouTubeSubtitleLoader from './YouTubeSubtitleLoader';
import ExerciseList from './ExerciseList';
import {
  generateExercisesFromText,
  type GeneratedExercise,
} from '../services/practiceApi';
import {
  Play,
  Square,
  Volume2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Sample practice texts for different levels
const PRACTICE_TEXTS = {
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

type PracticeDifficulty = 'Easy' | 'Medium' | 'Hard';
type PracticeRenderer = 'classic-inline' | 'multi-sentence';
const SENTENCES_PER_BLOCK = 10;
const INITIAL_BLOCKS = 2;

function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.map((sentence) => sentence.trim()).filter(Boolean) : [normalized];
}

function buildFallbackExercises(text: string): GeneratedExercise[] {
  const stopwords = new Set(['a', 'an', 'the', 'is', 'are', 'to', 'in', 'on', 'at', 'for', 'of', 'and', 'or']);
  return splitIntoSentences(text).map((sentence, sentenceIndex) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    const candidates = words
      .map((word, wordIndex) => {
        const normalized = word.toLowerCase().replace(/[^a-z'-]/gi, '');
        if (normalized.length <= 4 || stopwords.has(normalized)) return -1;
        return wordIndex;
      })
      .filter((index) => index >= 0);

    const maxBlanks = Math.max(1, Math.round(candidates.length * 0.25));
    const selected = candidates.slice(0, maxBlanks);

    return {
      id: sentenceIndex + 1,
      sentence_text: sentence,
      masked_sentence: words.map((word, idx) => (selected.includes(idx) ? '_______' : word)).join(' '),
      start_time: sentenceIndex * 5,
      end_time: sentenceIndex * 5 + 5,
      blanks_json: selected.map((index) => ({
        index,
        answer: words[index].toLowerCase().replace(/[^a-z'-]/gi, ''),
        hint_type: 'definition',
      })),
    };
  });
}

export default function PracticeMode() {
  const {
    practiceOriginalText,
    practiceSpeed,
    selectedLanguage,
    setPracticeOriginalText,
    setPracticeSpeed,
    addPracticeSession,
  } = useDictationStore();

  const { speak, stop, isSupported, isPlaying } = useTextToSpeech();

  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('Medium');
  const [showResult, setShowResult] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderer, setRenderer] = useState<PracticeRenderer>('classic-inline');
  const [multiScore, setMultiScore] = useState<{ correct: number; total: number } | null>(null);
  const [blockCount, setBlockCount] = useState(INITIAL_BLOCKS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentTexts = PRACTICE_TEXTS[difficulty];
  const randomText = currentTexts[Math.floor(Math.random() * currentTexts.length)];

  const loadExercises = async (text: string) => {
    if (!text.trim()) {
      setExercises([]);
      return;
    }

    setIsGenerating(true);
    try {
      const fetched = await generateExercisesFromText(text);
      setExercises(fetched);
      setBlockCount(INITIAL_BLOCKS);
    } catch {
      setExercises(buildFallbackExercises(text));
      setBlockCount(INITIAL_BLOCKS);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    void loadExercises(practiceOriginalText);
  }, [practiceOriginalText]);

  const handleNewPractice = () => {
    const selectedText = useCustomText && customText.trim() ? customText.trim() : randomText;
    setPracticeOriginalText(selectedText);
    void loadExercises(selectedText);
    setAnswers({});
    setShowResult(false);
    setMultiScore(null);
    setBlockCount(INITIAL_BLOCKS);
    setIsLoadingMore(false);
    setShowOriginal(false);
  };

  const handleSpeak = () => {
    if (practiceOriginalText) {
      speak(practiceOriginalText);
    }
  };

  const handleStop = () => {
    stop();
  };

  const normalizeAnswer = (value: string) =>
    value.toLowerCase().replace(/[^\w\s-]|_/g, '').replace(/\s+/g, ' ').trim();

  const getBlankKey = (sentenceIndex: number, blankIndex: number) => `${sentenceIndex}-${blankIndex}`;

  const checkAnswer = (
    sentenceIndex: number,
    blankIndex: number,
    correctWord: string
  ): 'correct' | 'incorrect' | null => {
    const userValue = answers[getBlankKey(sentenceIndex, blankIndex)];
    if (!userValue?.trim()) return null;
    return normalizeAnswer(userValue) === normalizeAnswer(correctWord) ? 'correct' : 'incorrect';
  };

  // For multi-sentence/paragraph mode, calculate visible blocks
  const totalBlocks = Math.ceil(exercises.length / SENTENCES_PER_BLOCK);
  const visibleBlocks = Math.min(blockCount, totalBlocks);
  const visibleSentences = exercises.slice(0, visibleBlocks * SENTENCES_PER_BLOCK);
  const hasMore = visibleBlocks < totalBlocks;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setBlockCount((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 250);
  };

  const handleCheckAnswer = () => {
    if (!practiceOriginalText || visibleSentences.length === 0) return;
    setShowResult(true);

    const totalBlanks = visibleSentences.reduce((sum, sentence) => sum + sentence.blanks_json.length, 0);
    const correctBlanks = visibleSentences.reduce((sum, sentence, sentenceIndex) => {
      const correctInSentence = sentence.blanks_json.filter(
        (blank) => checkAnswer(sentenceIndex, blank.index, blank.answer) === 'correct'
      ).length;
      return sum + correctInSentence;
    }, 0);
    const accuracy = totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 100;
    setMultiScore({ correct: correctBlanks, total: totalBlanks });

    const userText = visibleSentences
      .map((sentence, sentenceIndex) =>
        sentence.sentence_text.split(/\s+/)
          .map((word, wordIndex) => {
            const blank = sentence.blanks_json.find((item) => item.index === wordIndex);
            if (!blank) return word;
            const value = answers[getBlankKey(sentenceIndex, blank.index)]?.trim();
            return value || '_______';
          })
          .join(' ')
      )
      .join(' ');

    addPracticeSession({
      id: Math.random().toString(36).substring(2, 11),
      originalText: practiceOriginalText,
      userText,
      accuracy,
      timestamp: Date.now(),
      language: selectedLanguage,
    });
  };

  const handleFinishClassicSession = () => {
    if (!practiceOriginalText || exercises.length === 0) return;

    const totalBlanks = exercises.reduce((sum, sentence) => sum + sentence.blanks_json.length, 0);
    const correctBlanks = exercises.reduce((sum, sentence, sentenceIndex) => {
      const correctInSentence = sentence.blanks_json.filter(
        (blank) => checkAnswer(sentenceIndex, blank.index, blank.answer) === 'correct'
      ).length;
      return sum + correctInSentence;
    }, 0);
    const accuracy = totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 100;

    const userText = exercises
      .map((sentence, sentenceIndex) =>
        sentence.sentence_text.split(/\s+/)
          .map((word, wordIndex) => {
            const blank = sentence.blanks_json.find((item) => item.index === wordIndex);
            if (!blank) return word;
            const value = answers[getBlankKey(sentenceIndex, blank.index)]?.trim();
            return value || '_______';
          })
          .join(' ')
      )
      .join(' ');

    addPracticeSession({
      id: Math.random().toString(36).substring(2, 11),
      originalText: practiceOriginalText,
      userText,
      accuracy,
      timestamp: Date.now(),
      language: selectedLanguage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Mode selector header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Fill the blanks directly in each sentence
        </div>

        <button
          onClick={handleNewPractice}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          New Exercise
        </button>
      </div>

      {/* Setup panel - shown when no active practice */}
      {!practiceOriginalText && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold">Set Up Practice Session</h2>

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

          {/* Custom text option */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomText}
                onChange={(e) => setUseCustomText(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium">Use custom text</span>
            </label>

            {useCustomText && (
              <div className="space-y-3">
                <YouTubeSubtitleLoader
                  onTextLoaded={(text) => {
                    setCustomText(text);
                  }}
                />
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Or paste/type the text you want to practice with..."
                  className="w-full min-h-[100px] rounded-lg border border-border bg-transparent p-3 text-sm outline-none resize-none placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>

          {/* Speed control */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Speech Speed: {practiceSpeed} WPM
            </label>
            <input
              type="range"
              min="80"
              max="250"
              value={practiceSpeed}
              onChange={(e) => setPracticeSpeed(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow (80)</span>
              <span>Normal (150)</span>
              <span>Fast (250)</span>
            </div>
          </div>
        </div>
      )}

      {/* Active practice session */}
      {practiceOriginalText && (
        <>
          {/* Audio player controls */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Listen to the text</span>
              </div>

              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <button
                    onClick={handleSpeak}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    aria-label="Play audio"
                  >
                    <Play className="h-5 w-5 fill-current" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleStop}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      aria-label="Stop audio"
                    >
                      <Square className="h-5 w-5 fill-current" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Hidden original text (can reveal for help) */}
            <div className="space-y-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOriginal ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {showOriginal ? 'Hide' : 'Show'} original text
              </button>

              {showOriginal && (
                <div className="rounded-lg bg-accent/50 p-4 text-sm leading-relaxed">
                  {practiceOriginalText}
                </div>
              )}
            </div>
          </div>

          {/* Masked practice exercise */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Practice (Masked Sentences)</h3>
              <span className="text-xs text-muted-foreground">
                Difficulty: {difficulty}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRenderer('classic-inline');
                  setShowResult(false);
                  setMultiScore(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderer === 'classic-inline'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card hover:bg-accent'
                }`}
              >
                Classic Inline
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenderer('multi-sentence');
                  setShowResult(false);
                  setMultiScore(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderer === 'multi-sentence'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card hover:bg-accent'
                }`}
              >
                Multi-Sentence
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Fill each blank with the most suitable word from context.
            </p>
            {isGenerating && (
              <p className="text-xs text-muted-foreground">Generating deterministic cloze data...</p>
            )}
            <ExerciseList
              exercises={exercises}
              answers={answers}
              checked={showResult}
              renderer={renderer}
              chunkSize={SENTENCES_PER_BLOCK}
              hasMore={renderer === 'multi-sentence' ? hasMore : false}
              isLoadingMore={renderer === 'multi-sentence' ? isLoadingMore : false}
              onLoadMore={renderer === 'multi-sentence' ? handleLoadMore : undefined}
              onAnswerChange={(exerciseIndex, blankIndex, value) =>
                setAnswers((prev) => ({ ...prev, [`${exerciseIndex}-${blankIndex}`]: value }))
              }
            />
            {renderer === 'multi-sentence' && multiScore && (
              <div className="rounded-lg border border-border bg-accent/30 p-3 text-sm">
                Score: {multiScore.correct}/{multiScore.total} correct (
                {multiScore.total > 0 ? Math.round((multiScore.correct / multiScore.total) * 100) : 100}%)
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <button
                onClick={() => {
                  setAnswers({});
                  setShowResult(false);
                  setMultiScore(null);
                }}
                disabled={!Object.keys(answers).length}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                Clear
              </button>
              {renderer === 'multi-sentence' ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={exercises.length === 0 || exercises.every((sentence) => sentence.blanks_json.length === 0)}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Check Answers
                </button>
              ) : (
                <button
                  onClick={handleFinishClassicSession}
                  disabled={exercises.length === 0 || exercises.every((sentence) => sentence.blanks_json.length === 0)}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Finish Session
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {!isSupported && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          Text-to-speech is not supported in your browser. You can still use typing mode.
        </div>
      )}
    </div>
  );
}
