import cefrMap from '../data/cefr-map.json' with { type: 'json' };
import { query } from '../db/pool.js';

const FALLBACK_MEANING = 'No definition available';

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z'-]/gi, '');
}

async function fetchDefinitionFromApi(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!response.ok) return null;
    const data = await response.json();
    const firstMeaning = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    return typeof firstMeaning === 'string' && firstMeaning.trim() ? firstMeaning : null;
  } catch {
    return null;
  }
}

export async function getVocabularyInfo(rawWord) {
  const word = normalizeWord(rawWord);
  if (!word) {
    return { word: rawWord, cef_level: 'Unknown', meaning_vi: FALLBACK_MEANING, source: 'fallback' };
  }

  const cached = await query(
    'SELECT word, cef_level, meaning_vi FROM static_vocabulary WHERE word = $1 LIMIT 1',
    [word]
  );

  if (cached.rows.length > 0) {
    return { ...cached.rows[0], source: 'cache' };
  }

  const meaning = (await fetchDefinitionFromApi(word)) ?? FALLBACK_MEANING;
  const cef_level = cefrMap[word] ?? null;

  await query(
    `INSERT INTO static_vocabulary (word, cef_level, meaning_vi)
     VALUES ($1, $2, $3)
     ON CONFLICT (word) DO UPDATE SET
       cef_level = COALESCE(EXCLUDED.cef_level, static_vocabulary.cef_level),
       meaning_vi = COALESCE(EXCLUDED.meaning_vi, static_vocabulary.meaning_vi)`,
    [word, cef_level, meaning]
  );

  return {
    word,
    cef_level: cef_level ?? 'Unknown',
    meaning_vi: meaning,
    source: meaning === FALLBACK_MEANING ? 'fallback' : 'dictionary-api',
  };
}
