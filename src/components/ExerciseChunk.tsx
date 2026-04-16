import type { GeneratedExercise } from '../services/practiceApi';
import InlineClozeSentence from './InlineClozeSentence';

interface ExerciseChunkProps {
  chunkId: number;
  sentences: GeneratedExercise[];
  startIndex: number;
  answers: Record<string, string>;
  checked: boolean;
  onAnswerChange: (exerciseIndex: number, blankIndex: number, value: string) => void;
}

export default function ExerciseChunk({
  chunkId,
  sentences,
  startIndex,
  answers,
  checked,
  onAnswerChange,
}: ExerciseChunkProps) {
  return (
    <div className="rounded-xl border border-border bg-accent/20 p-4">
      <div className="mb-3 text-xs font-medium text-muted-foreground">Practice Chunk {chunkId}</div>
      <div className="flex flex-col gap-4">
        {sentences.map((exercise, localIndex) => {
          const exerciseIndex = startIndex + localIndex;
          return (
            <InlineClozeSentence
              key={`chunk-${chunkId}-${exercise.id ?? exerciseIndex}`}
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
