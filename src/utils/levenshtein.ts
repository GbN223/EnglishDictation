/**
 * Levenshtein Distance Algorithm for pronunciation scoring
 * Calculates the minimum number of single-character edits needed to transform one string into another
 */

/**
 * Calculate Levenshtein Distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of edits needed to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix to store distances
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove punctuation
 * - Trim whitespace
 * - Collapse multiple spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim();
}

/**
 * Calculate pronunciation accuracy percentage
 * @param spoken - The text spoken by the user
 * @param target - The target/original text
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(spoken: string, target: string): number {
  const normalizedSpoken = normalizeText(spoken);
  const normalizedTarget = normalizeText(target);

  // Handle edge cases
  if (!normalizedTarget) return 100;
  if (!normalizedSpoken) return 0;

  const distance = levenshteinDistance(normalizedSpoken, normalizedTarget);
  const maxLength = Math.max(normalizedSpoken.length, normalizedTarget.length);

  // Accuracy = 1 - (distance / max_length)
  const accuracy = 1 - distance / maxLength;

  // Return as percentage (0-100), rounded to nearest integer
  return Math.round(accuracy * 100);
}

/**
 * Get score category based on accuracy percentage
 * @param accuracy - Accuracy percentage (0-100)
 * @returns Score category object with color and label
 */
export function getScoreCategory(accuracy: number): {
  category: 'excellent' | 'good' | 'needs-improvement';
  color: string;
  label: string;
} {
  if (accuracy >= 90) {
    return {
      category: 'excellent',
      color: 'text-green-500',
      label: 'Excellent',
    };
  } else if (accuracy >= 70) {
    return {
      category: 'good',
      color: 'text-yellow-500',
      label: 'Good',
    };
  } else {
    return {
      category: 'needs-improvement',
      color: 'text-red-500',
      label: 'Needs Improvement',
    };
  }
}

/**
 * Compare word-by-word for detailed feedback
 * @param spoken - The text spoken by the user
 * @param target - The target/original text
 * @returns Array of words with match status
 */
export function compareWords(spoken: string, target: string): Array<{
  word: string;
  isMatch: boolean;
  isExtra: boolean;
  isMissing: boolean;
}> {
  const spokenWords = normalizeText(spoken).split(' ').filter(Boolean);
  const targetWords = normalizeText(target).split(' ').filter(Boolean);

  const result: Array<{
    word: string;
    isMatch: boolean;
    isExtra: boolean;
    isMissing: boolean;
  }> = [];

  const maxLen = Math.max(spokenWords.length, targetWords.length);

  for (let i = 0; i < maxLen; i++) {
    const spokenWord = spokenWords[i];
    const targetWord = targetWords[i];

    if (spokenWord === undefined && targetWord !== undefined) {
      // Missing word
      result.push({
        word: targetWord,
        isMatch: false,
        isExtra: false,
        isMissing: true,
      });
    } else if (targetWord === undefined && spokenWord !== undefined) {
      // Extra word
      result.push({
        word: spokenWord,
        isMatch: false,
        isExtra: true,
        isMissing: false,
      });
    } else if (spokenWord === targetWord) {
      // Match
      result.push({
        word: spokenWord,
        isMatch: true,
        isExtra: false,
        isMissing: false,
      });
    } else {
      // Mismatch - show both
      result.push({
        word: `${spokenWord} → ${targetWord}`,
        isMatch: false,
        isExtra: false,
        isMissing: false,
      });
    }
  }

  return result;
}
