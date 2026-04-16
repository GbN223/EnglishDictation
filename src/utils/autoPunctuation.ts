/**
 * Auto-Punctuation Assist utilities
 * Helps users with proper punctuation without being aggressive
 */

interface PunctuationConfig {
  autoCapitalize: boolean;
  autoPeriod: boolean;
  smartComma: boolean;
}

const defaultConfig: PunctuationConfig = {
  autoCapitalize: true,
  autoPeriod: true,
  smartComma: true,
};

/**
 * Normalize text for comparison (lowercase, trim)
 */
function normalizeForComparison(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if user's input matches the end of target text (ignoring case/punctuation)
 */
function matchesEndOfTarget(userInput: string, targetText: string): boolean {
  const normalizedUser = normalizeForComparison(userInput);
  const normalizedTarget = normalizeForComparison(targetText);
  
  // Remove trailing punctuation from both
  const userWords = normalizedUser.replace(/[.,!?;:]+$/, '').split(/\s+/);
  const targetWords = normalizedTarget.replace(/[.,!?;:]+$/, '').split(/\s+/);
  
  // Get last word from user input
  const lastUserWord = userWords[userWords.length - 1];
  // Get last word from target
  const lastTargetWord = targetWords[targetWords.length - 1];
  
  return lastUserWord === lastTargetWord;
}

/**
 * Auto-capitalize first letter of a sentence
 */
export function applyAutoCapitalization(value: string): string {
  if (!value) return value;
  
  // Capitalize first character
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Check if we should auto-append a period
 */
export function shouldAppendPeriod(userInput: string, targetText: string): boolean {
  if (!userInput || !targetText) return false;
  
  // Don't add if already has ending punctuation
  if (/[.!?]$/.test(userInput.trim())) return false;
  
  // Check if user input matches end of target
  return matchesEndOfTarget(userInput, targetText);
}

/**
 * Check if we should auto-append a comma after specific words
 */
export function shouldAppendComma(userInput: string, targetText: string): boolean {
  if (!userInput || !targetText) return false;
  
  // Don't add if already ends with comma
  if (/,$/.test(userInput.trim())) return false;
  
  const normalizedUser = normalizeForComparison(userInput);
  const normalizedTarget = normalizeForComparison(targetText);
  
  // Find commas in target text and their preceding words
  const targetWithCommas = normalizedTarget.split(',');
  
  if (targetWithCommas.length < 2) return false;
  
  // Get words before each comma in target
  for (let i = 0; i < targetWithCommas.length - 1; i++) {
    const segment = targetWithCommas[i].trim();
    const words = segment.split(/\s+/);
    const wordBeforeComma = words[words.length - 1];
    
    // Check if user just typed this word
    const userWords = normalizedUser.split(/\s+/);
    const lastUserWord = userWords[userWords.length - 1];
    
    if (lastUserWord === wordBeforeComma) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply auto-punctuation to user input
 * Returns the modified value with appropriate punctuation
 */
export function applyAutoPunctuation(
  userInput: string,
  targetText: string,
  config: PunctuationConfig = defaultConfig
): string {
  let result = userInput;
  
  if (config.autoCapitalize) {
    result = applyAutoCapitalization(result);
  }
  
  if (config.autoPeriod && shouldAppendPeriod(result, targetText)) {
    result = result + '.';
  } else if (config.smartComma && shouldAppendComma(result, targetText)) {
    result = result + ',';
  }
  
  return result;
}

/**
 * Get hint text for a blank (reveal first letter or full word)
 */
export function getHintForBlank(correctAnswer: string, revealFull: boolean = false): string {
  if (!correctAnswer) return '';
  
  if (revealFull) {
    return correctAnswer;
  }
  
  // Reveal first letter only
  return correctAnswer.charAt(0).toUpperCase();
}
