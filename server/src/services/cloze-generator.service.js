import stopwords from '../data/stopwords.json' with { type: 'json' };

const STOPWORDS = new Set(stopwords);
const CONTENT_WORD_RE = /^[A-Za-z][A-Za-z'-]*$/;
const POS_HEURISTIC_RE = /(tion|ment|ness|ity|ship|ism|ous|ful|ive|able|ible|ic|al|ize|ise|ing|ed)$/i;

function splitSentences(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [normalized];
}

function tokenize(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

function normalizeToken(token) {
  return token.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/gi, '');
}

function isMaskableWord(token) {
  const normalized = normalizeToken(token);
  if (!normalized || normalized.length <= 4) return false;
  if (STOPWORDS.has(normalized)) return false;
  if (!CONTENT_WORD_RE.test(normalized)) return false;

  return POS_HEURISTIC_RE.test(normalized) || normalized.length >= 6;
}

function deterministicSelection(candidates, ratio = 0.25) {
  if (!candidates.length) return [];
  const count = Math.max(1, Math.round(candidates.length * ratio));
  const step = Math.max(1, Math.floor(candidates.length / count));
  const selected = [];

  for (let i = 0; i < candidates.length && selected.length < count; i += step) {
    selected.push(candidates[i]);
  }

  let cursor = 0;
  while (selected.length < count && cursor < candidates.length) {
    const candidate = candidates[cursor];
    if (!selected.includes(candidate)) selected.push(candidate);
    cursor += 1;
  }

  return selected.sort((a, b) => a - b);
}

export function createClozeExercises(rawText, options = {}) {
  const ratio = Math.min(0.3, Math.max(0.2, options.maskRatio ?? 0.25));
  const startOffset = Number(options.startOffset ?? 0);
  const sentenceSeconds = Number(options.sentenceSeconds ?? 5);

  const sentences = splitSentences(rawText);
  return sentences.map((sentence, sentenceIndex) => {
    const words = tokenize(sentence);
    const candidates = words
      .map((word, wordIndex) => (isMaskableWord(word) ? wordIndex : -1))
      .filter((index) => index >= 0);
    const selectedIndices = deterministicSelection(candidates, ratio);

    const blanks = selectedIndices.map((index) => ({
      index,
      answer: normalizeToken(words[index]),
      hint_type: 'definition',
    }));

    const maskedWords = words.map((word, index) => (selectedIndices.includes(index) ? '_______' : word));

    const start_time = startOffset + sentenceIndex * sentenceSeconds;
    const end_time = start_time + sentenceSeconds;

    return {
      sentence_text: sentence,
      masked_sentence: maskedWords.join(' '),
      start_time,
      end_time,
      blanks_json: blanks,
    };
  });
}
