import type { ParagraphBlock } from '../services/practiceApi';
import InlineClozeSentence from './InlineClozeSentence';

interface ExerciseChunkProps {
  block: ParagraphBlock;
  startIndex: number;
  answers: Record<string, string>;
  checked: boolean;
  onAnswerChange: (exerciseIndex: number, blankIndex: number, value: string) => void;
}

export default function ExerciseChunk({
  block,
  startIndex,
  answers,
  checked,
  onAnswerChange,
}: ExerciseChunkProps) {
  return (
    <div className="rounded-xl border border-border bg-accent/20 p-4">
      <div className="mb-3 text-xs font-medium text-muted-foreground">Paragraph Block {block.blockId}</div>
      <div className="flex flex-col gap-4">
        {block.sentences.map((sentence, localIndex) => {
          const exerciseIndex = startIndex + localIndex;
          // Convert sentence format to GeneratedExercise format for InlineClozeSentence
          const exercise = {
            id: typeof sentence.id === 'number' ? sentence.id : exerciseIndex + 1,
            sentence_text: sentence.original,
            masked_sentence: sentence.original, // Will be masked by InlineClozeSentence based on blanks
            start_time: exerciseIndex * 5,
            end_time: exerciseIndex * 5 + 5,
            blanks_json: sentence.blanks,
          };
          return (
            <InlineClozeSentence
              key={`block-${block.blockId}-${sentence.id ?? exerciseIndex}`}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              answers={answers}
              checked={checked}
              onAnswerChange={onAnswerChange}
              compact
            />
          );
        })}
      </div>
    </div>
  );
}
