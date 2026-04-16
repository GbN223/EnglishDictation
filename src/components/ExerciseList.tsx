import { useEffect, useState } from 'react';
import type { GeneratedExercise, ParagraphBlock } from '../services/practiceApi';
import InlineClozeSentence from './InlineClozeSentence';
import ExerciseChunk from './ExerciseChunk';

interface ExerciseListProps {
  exercises: GeneratedExercise[];
  blocks?: ParagraphBlock[];
  answers: Record<string, string>;
  checked: boolean;
  renderer: 'classic-inline' | 'multi-sentence';
  chunkSize?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onAnswerChange: (exerciseIndex: number, blankIndex: number, value: string) => void;
}

export default function ExerciseList({
  exercises,
  blocks,
  answers,
  checked,
  renderer,
  chunkSize = 10,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onAnswerChange,
}: ExerciseListProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [checkedBySentence, setCheckedBySentence] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCurrentSentenceIndex(0);
    setCheckedBySentence({});
  }, [renderer, exercises]);

  if (exercises.length === 0 && (!blocks || blocks.length === 0)) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        No exercises generated yet. Click New Exercise to load masked sentences.
      </div>
    );
  }

  if (renderer === 'classic-inline') {
    const currentExercise = exercises[currentSentenceIndex];
    const isChecked = checkedBySentence[currentSentenceIndex] ?? false;

    return (
      <div className="space-y-3">
        <InlineClozeSentence
          key={`classic-${currentExercise.id ?? currentSentenceIndex}-${currentSentenceIndex}`}
          exercise={currentExercise}
          exerciseIndex={currentSentenceIndex}
          answers={answers}
          checked={isChecked}
          onAnswerChange={onAnswerChange}
        />
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Sentence {currentSentenceIndex + 1} of {exercises.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSentenceIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSentenceIndex === 0}
              className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setCheckedBySentence((prev) => ({ ...prev, [currentSentenceIndex]: true }))
              }
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              Check Sentence
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentSentenceIndex((prev) => Math.min(exercises.length - 1, prev + 1))
              }
              disabled={currentSentenceIndex === exercises.length - 1}
              className="rounded-md border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-sentence / paragraph mode rendering
  if (blocks && blocks.length > 0) {
    // Render using blocks from API (paragraph mode with 10 sentences per block)
    let totalSentencesBeforeBlock = 0;
    return (
      <div className="space-y-4">
        {blocks.map((block) => {
          const currentBlock = block;
          const startIndex = totalSentencesBeforeBlock;
          totalSentencesBeforeBlock += block.sentences.length;

          return (
            <ExerciseChunk
              key={`block-${block.blockId}`}
              block={currentBlock}
              startIndex={startIndex}
              answers={answers}
              checked={checked}
              onAnswerChange={onAnswerChange}
            />
          );
        })}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback: group local exercises into chunks (for text-based practice without API blocks)
  return (
    <div className="space-y-4">
      {Array.from({ length: Math.ceil(exercises.length / chunkSize) }).map((_, chunkIndex) => {
        const startIndex = chunkIndex * chunkSize;
        const sentences = exercises.slice(startIndex, startIndex + chunkSize);

        return (
          <ExerciseChunk
            key={`chunk-${chunkIndex}`}
            block={{
              blockId: chunkIndex + 1,
              sentences: sentences.map((s) => ({
                id: s.id ?? chunkIndex,
                original: s.sentence_text,
                blanks: s.blanks_json,
              })),
            }}
            startIndex={startIndex}
            answers={answers}
            checked={checked}
            onAnswerChange={onAnswerChange}
          />
        );
      })}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
