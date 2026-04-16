import { DiffResult } from '../types';

/**
 * Computes word-level diff between original and user text
 */
export function computeDiff(original: string, user: string): DiffResult[] {
  const originalWords = original.trim().split(/\s+/);
  const userWords = user.trim().split(/\s+/);

  // Simple LCS-based diff for word-level comparison
  const dp: number[][] = Array.from({ length: originalWords.length + 1 }, () =>
    Array(userWords.length + 1).fill(0)
  );

  // Build LCS table
  for (let i = 1; i <= originalWords.length; i++) {
    for (let j = 1; j <= userWords.length; j++) {
      if (
        originalWords[i - 1].toLowerCase() ===
        userWords[j - 1].toLowerCase()
      ) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the diff
  const result: DiffResult[] = [];
  let i = originalWords.length;
  let j = userWords.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      originalWords[i - 1].toLowerCase() === userWords[j - 1].toLowerCase()
    ) {
      result.unshift({
        type: 'match',
        value: originalWords[i - 1],
        originalIndex: i - 1,
        userIndex: j - 1,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'insert',
        value: userWords[j - 1],
        userIndex: j - 1,
      });
      j--;
    } else if (i > 0) {
      result.unshift({
        type: 'delete',
        value: originalWords[i - 1],
        originalIndex: i - 1,
      });
      i--;
    }
  }

  return result;
}

/**
 * Calculates accuracy percentage
 */
export function calculateAccuracy(original: string, user: string): number {
  if (!original.trim()) return 100;
  if (!user.trim()) return 0;

  const diff = computeDiff(original, user);
  const matches = diff.filter((d) => d.type === 'match').length;
  const total = diff.length;

  return total > 0 ? Math.round((matches / total) * 100) : 0;
}

/**
 * Groups consecutive same-type diff results for compact display
 */
export function groupDiffResults(diff: DiffResult[]): DiffResult[] {
  const grouped: DiffResult[] = [];
  let currentGroup: DiffResult | null = null;

  for (const item of diff) {
    if (!currentGroup || currentGroup.type !== item.type) {
      if (currentGroup) {
        grouped.push(currentGroup);
      }
      currentGroup = { ...item };
    } else {
      currentGroup.value += ' ' + item.value;
    }
  }

  if (currentGroup) {
    grouped.push(currentGroup);
  }

  return grouped;
}

/**
 * Gets detailed stats about the comparison
 */
export function getComparisonStats(original: string, user: string) {
  const originalWords = original.trim().split(/\s+/).filter(Boolean);
  const userWords = user.trim().split(/\s+/).filter(Boolean);
  const diff = computeDiff(original, user);

  const matches = diff.filter((d) => d.type === 'match').length;
  const insertions = diff.filter((d) => d.type === 'insert').length;
  const deletions = diff.filter((d) => d.type === 'delete').length;

  return {
    originalWordCount: originalWords.length,
    userWordCount: userWords.length,
    matches,
    insertions,
    deletions,
    accuracy: Math.round((matches / Math.max(diff.length, 1)) * 100),
    missing: deletions,
    extra: insertions,
  };
}
