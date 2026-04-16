import { useMemo, useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { getWordDefinition, type VocabularyInfo } from '../services/practiceApi';

type ValidationStatus = 'correct' | 'incorrect' | null;

interface ClozeBlank {
  start_word_index: number;
  answer: string;
}

export interface ClozeSentence {
  id: number;
  original_sentence: string;
  blanks: ClozeBlank[];
  /** Optional URL for sentence / exercise audio (e.g. TTS or pre-recorded clip). */
  audioUrl?: string;
}

interface InlineClozeTestProps {
  sentenceData: ClozeSentence;
  /** Overrides `sentenceData.audioUrl` when set. */
  audioUrl?: string;
}

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function InlineClozeTest({ sentenceData, audioUrl: audioUrlProp }: InlineClozeTestProps) {
  const resolvedAudioUrl = audioUrlProp ?? sentenceData.audioUrl;
  const words = useMemo(
    () => sentenceData.original_sentence.split(/\s+/).filter(Boolean),
    [sentenceData.original_sentence]
  );
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState(false);
  const [vocabInfo, setVocabInfo] = useState<VocabularyInfo | null>(null);

  const blanksByIndex = useMemo(() => {
    return sentenceData.blanks.reduce<Record<number, ClozeBlank>>((acc, blank) => {
      acc[blank.start_word_index] = blank;
      return acc;
    }, {});
  }, [sentenceData.blanks]);

  const handleChange = (wordIndex: number, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [wordIndex]: value }));
  };

  const checkAnswer = (wordIndex: number, correctWord: string): ValidationStatus => {
    const userValue = userAnswers[wordIndex];
    if (!userValue?.trim()) return null;

    return normalizeValue(userValue) === normalizeValue(correctWord) ? 'correct' : 'incorrect';
  };

  const handleWordClick = async (word: string) => {
    const normalized = word.toLowerCase().replace(/[^a-z'-]/gi, '');
    if (!normalized) return;
    try {
      setVocabInfo(await getWordDefinition(normalized));
    } catch {
      setVocabInfo({
        word: normalized,
        cef_level: 'Unknown',
        meaning_vi: 'No definition available',
        source: 'fallback',
      });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 md:p-5">
      <AudioPlayer audioUrl={resolvedAudioUrl} />

      <div className="flex flex-wrap items-end gap-x-2 gap-y-3 leading-8">
        {words.map((word, index) => {
          const blank = blanksByIndex[index];
          if (!blank) {
            return (
              <span key={`word-${sentenceData.id}-${index}`} className="text-sm md:text-base">
                <button
                  type="button"
                  onClick={() => handleWordClick(word)}
                  className="rounded px-1 hover:bg-accent/80"
                >
                  {word}
                </button>
              </span>
            );
          }

          const status = isChecked ? checkAnswer(index, blank.answer) : null;
          const statusClass =
            status === 'correct'
              ? 'border-green-500 text-green-700 dark:text-green-400'
              : status === 'incorrect'
                ? 'border-red-500 text-red-700 dark:text-red-400'
                : 'border-muted-foreground/40 text-foreground';

          const widthClass =
            blank.answer.length <= 5 ? 'w-20' : blank.answer.length <= 8 ? 'w-28' : 'w-36';

          return (
            <input
              key={`blank-${sentenceData.id}-${index}`}
              type="text"
              value={userAnswers[index] ?? ''}
              onChange={(e) => handleChange(index, e.target.value)}
              aria-label={`Blank ${index + 1} answer`}
              className={`h-8 min-w-[4.5rem] rounded-none border-0 border-b-2 bg-transparent px-1 text-center text-sm outline-none transition-colors md:text-base ${widthClass} ${statusClass}`}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setIsChecked(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Check Answers
      </button>
      {vocabInfo && (
        <div className="rounded-lg border border-border bg-accent/30 p-3 text-sm">
          <span className="font-medium">{vocabInfo.word}</span> - CEFR: {vocabInfo.cef_level} - {vocabInfo.meaning_vi}
        </div>
      )}
    </div>
  );
}
