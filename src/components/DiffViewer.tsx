import { DiffResult } from '../types';
import { computeDiff, groupDiffResults, getComparisonStats } from '../utils/diff';

interface DiffViewerProps {
  originalText: string;
  userText: string;
}

export default function DiffViewer({ originalText, userText }: DiffViewerProps) {
  const diff = computeDiff(originalText, userText);
  const grouped = groupDiffResults(diff);
  const stats = getComparisonStats(originalText, userText);

  const hasInput = originalText.trim() && userText.trim();

  // Get accuracy color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 70) return 'text-yellow-500';
    if (accuracy >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500/10 border-green-500/20';
    if (accuracy >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
    if (accuracy >= 50) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  if (!hasInput) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {!originalText.trim()
            ? 'Enter or paste text to practice'
            : 'Start typing or speaking to see comparison'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Accuracy Score */}
      <div
        className={`rounded-xl border ${getAccuracyBg(stats.accuracy)} p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
            <p className={`text-4xl font-bold ${getAccuracyColor(stats.accuracy)}`}>
              {stats.accuracy}%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-green-500">{stats.matches}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-500">{stats.missing}</p>
              <p className="text-xs text-muted-foreground">Missing</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-blue-500">{stats.extra}</p>
              <p className="text-xs text-muted-foreground">Extra</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.accuracy >= 90
                ? 'bg-green-500'
                : stats.accuracy >= 70
                ? 'bg-yellow-500'
                : stats.accuracy >= 50
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${stats.accuracy}%` }}
          />
        </div>
      </div>

      {/* Word-by-word comparison */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Word-by-Word Comparison</h3>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="inline-block w-3 h-3 bg-green-500/20 rounded mr-1" /> Correct
            <span className="inline-block w-3 h-3 bg-red-500/20 rounded ml-3 mr-1" /> Missing
            <span className="inline-block w-3 h-3 bg-blue-500/20 rounded ml-3 mr-1" /> Extra
          </p>
        </div>

        {/* Original text with highlights */}
        <div className="p-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Original Text:</p>
          <div className="leading-relaxed">
            {grouped.map((item, index) => (
              <span
                key={index}
                className={`inline px-1 py-0.5 rounded mx-0.5 ${
                  item.type === 'match'
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : item.type === 'delete'
                    ? 'bg-red-500/20 text-red-700 dark:text-red-300 line-through'
                    : ''
                }`}
              >
                {item.value}
              </span>
            ))}
          </div>
        </div>

        {/* User text with highlights */}
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Your Text:</p>
          <div className="leading-relaxed">
            {grouped.map((item, index) => (
              <span
                key={index}
                className={`inline px-1 py-0.5 rounded mx-0.5 ${
                  item.type === 'match'
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : item.type === 'insert'
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : ''
                }`}
              >
                {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
