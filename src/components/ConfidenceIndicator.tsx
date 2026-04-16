import { useDictationStore } from '../store/dictationStore';
import { BarChart3 } from 'lucide-react';

export default function ConfidenceIndicator() {
  const { confidenceScores } = useDictationStore();

  if (confidenceScores.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Confidence: --</span>
      </div>
    );
  }

  const averageConfidence =
    confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  const percentage = Math.round(averageConfidence * 100);

  let color = 'text-red-500';
  let bgColor = 'bg-red-500/10';
  let borderColor = 'border-red-500/20';

  if (percentage >= 90) {
    color = 'text-green-500';
    bgColor = 'bg-green-500/10';
    borderColor = 'border-green-500/20';
  } else if (percentage >= 75) {
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-500/10';
    borderColor = 'border-yellow-500/20';
  } else if (percentage >= 60) {
    color = 'text-orange-500';
    bgColor = 'bg-orange-500/10';
    borderColor = 'border-orange-500/20';
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border ${borderColor} ${bgColor} px-4 py-3`}>
      <BarChart3 className={`h-4 w-4 ${color}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${color}`}>
          Confidence: {percentage}%
        </span>
        <span className="text-xs text-muted-foreground">
          {confidenceScores.length} segment{confidenceScores.length !== 1 ? 's' : ''}
        </span>
      </div>
      {/* Progress bar */}
      <div className="ml-2 h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            percentage >= 90 ? 'bg-green-500' :
            percentage >= 75 ? 'bg-yellow-500' :
            percentage >= 60 ? 'bg-orange-500' :
            'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
