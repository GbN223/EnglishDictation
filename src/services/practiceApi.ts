export interface ExerciseBlank {
  index: number;
  answer: string;
  hint_type: string;
}

export interface GeneratedExercise {
  id?: number;
  sentence_text: string;
  masked_sentence: string;
  start_time: number;
  end_time: number;
  blanks_json: ExerciseBlank[];
}

export interface VocabularyInfo {
  word: string;
  cef_level: string;
  meaning_vi: string;
  source: string;
}

export interface ParagraphBlock {
  blockId: number;
  sentences: Array<{
    id: number | string;
    original: string;
    blanks: ExerciseBlank[];
  }>;
}

export interface VideoExercisesPage {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  blocks: ParagraphBlock[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787';

interface ApiExerciseShape {
  id?: number;
  original_sentence?: string;
  sentence_text?: string;
  masked_sentence?: string;
  blanks?: Array<{ index: number; answer: string; hint_type?: string }>;
  blanks_json?: ExerciseBlank[];
  start_time?: number;
  end_time?: number;
}

function normalizeExercise(raw: ApiExerciseShape, index: number): GeneratedExercise {
  const sentenceText = raw.sentence_text ?? raw.original_sentence ?? '';
  const blanks = raw.blanks_json ?? raw.blanks ?? [];

  return {
    id: raw.id ?? index + 1,
    sentence_text: sentenceText,
    masked_sentence: raw.masked_sentence ?? sentenceText,
    start_time: Number(raw.start_time ?? index * 5),
    end_time: Number(raw.end_time ?? index * 5 + 5),
    blanks_json: blanks.map((blank) => ({
      index: Number(blank.index),
      answer: String(blank.answer),
      hint_type: blank.hint_type ?? 'definition',
    })),
  };
}

export async function generateExercisesFromText(text: string): Promise<GeneratedExercise[]> {
  const response = await fetch(`${API_BASE}/api/exercises/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate rule-based exercises.');
  }

  const data = (await response.json()) as { exercises?: ApiExerciseShape[] };
  return (data.exercises ?? []).map(normalizeExercise);
}

export async function getWordDefinition(word: string): Promise<VocabularyInfo> {
  const response = await fetch(`${API_BASE}/api/vocab/${encodeURIComponent(word)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vocabulary definition.');
  }

  return (await response.json()) as VocabularyInfo;
}

export async function getVideoExercisesPage(
  videoId: string,
  page = 1,
  limit = 10
): Promise<VideoExercisesPage> {
  const response = await fetch(
    `${API_BASE}/api/exercises/video/${encodeURIComponent(videoId)}?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch paginated video exercises.');
  }

  const data = (await response.json()) as {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    blocks?: Array<{
      blockId: number;
      sentences: Array<{
        id: number | string;
        original: string;
        blanks: ExerciseBlank[];
      }>;
    }>;
  };

  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    hasMore: data.hasMore,
    blocks: (data.blocks ?? []).map((block) => ({
      blockId: block.blockId,
      sentences: block.sentences.map((sentence) => ({
        id: sentence.id,
        original: sentence.original,
        blanks: sentence.blanks ?? [],
      })),
    })),
  };
}
