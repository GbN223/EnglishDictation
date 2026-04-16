import type { GeneratedExercise } from '../services/practiceApi';

type ValidationStatus = 'correct' | 'incorrect' | null;

interface InlineClozeSentenceProps {
  exercise: GeneratedExercise;
  exerciseIndex: number;
  answers: Record<string, string>;
  checked: boolean;
  onAnswerChange: (exerciseIndex: number, blankIndex: number, value: string) => void;
  compact?: boolean;
  isActive?: boolean;
}

function keyFor(exerciseIndex: number, blankIndex: number): string {
  return `${exerciseIndex}-${blankIndex}`;
}

function normalizeAnswer(value: string): string {
  return value.toLowerCase().replace(/[^\w\s-]|_/g, '').replace(/\s+/g, ' ').trim();
}

function getValidationStatus(
  answers: Record<string, string>,
  exerciseIndex: number,
  blankIndex: number,
  expected: string,
  checked: boolean
): ValidationStatus {
  if (!checked) return null;
  const userValue = answers[keyFor(exerciseIndex, blankIndex)];
  if (!userValue?.trim()) return null;
  return normalizeAnswer(userValue) === normalizeAnswer(expected) ? 'correct' : 'incorrect';
}

export default function InlineClozeSentence({
  exercise,
  exerciseIndex,
  answers,
  checked,
  onAnswerChange,
  compact = false,
  isActive = false,
}: InlineClozeSentenceProps) {
  const words = exercise.sentence_text.split(/\s+/).filter(Boolean);

  // Apply focus mode styling based on active state
  const containerClasses = compact
    ? `text-sm transition-all duration-300 ${
        isActive
          ? 'opacity-100 font-bold text-blue-600 bg-blue-50 rounded-lg p-2'
          : 'opacity-30 blur-[1px]'
      }`
    : `rounded-lg border border-border p-3 text-sm transition-all duration-300 ${
        isActive
          ? 'opacity-100 font-bold text-blue-600 bg-blue-50 border-blue-300'
          : 'opacity-30 blur-[1px]'
      }`;

  return (
    <div
      className={containerClasses}
      data-sentence-id={exercise.id ?? exerciseIndex}
    >
      <div className={`mb-2 text-xs ${isActive ? 'text-blue-500' : 'text-muted-foreground'}`}>
        Sentence {exerciseIndex + 1}
      </div>
      <div className="flex flex-wrap gap-2 leading-relaxed">
        {words.map((word, wordIndex) => {
          const blank = exercise.blanks_json.find((item) => item.index === wordIndex);
          if (!blank) {
            return (
              <span key={`word-${exerciseIndex}-${wordIndex}`} className="text-sm md:text-base">
                {word}
              </span>
            );
          }

          const status = getValidationStatus(answers, exerciseIndex, blank.index, blank.answer, checked);
          const statusClass =
            status === 'correct'
              ? 'border-green-500 text-green-700 dark:text-green-400'
              : status === 'incorrect'
                ? 'border-red-500 text-red-700 dark:text-red-400'
                : 'border-gray-300 text-foreground';

          return (
            <input
              key={`blank-${exerciseIndex}-${blank.index}`}
              type="text"
              value={answers[keyFor(exerciseIndex, blank.index)] ?? ''}
              onChange={(event) => onAnswerChange(exerciseIndex, blank.index, event.target.value)}
              aria-label={`Sentence ${exerciseIndex + 1}, blank ${blank.index + 1}`}
              className={`w-24 border-0 border-b-2 bg-transparent text-center outline-none transition-colors ${statusClass}`}
            />
          );
        })}
      </div>
      {exercise.blanks_json.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No blanks for this short sentence.</p>
      )}
    </div>
  );
}
