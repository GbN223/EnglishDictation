import { query } from '../db/pool.js';

function nextReviewIntervalDays(repetitions, easiness, quality, previousIntervalDays) {
  if (quality < 3) {
    return { repetitions: 0, intervalDays: 1, easiness: Math.max(1.3, easiness - 0.2) };
  }

  const updatedRepetitions = repetitions + 1;
  const updatedEasiness = Math.max(1.3, easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  if (updatedRepetitions === 1) return { repetitions: updatedRepetitions, intervalDays: 1, easiness: updatedEasiness };
  if (updatedRepetitions === 2) return { repetitions: updatedRepetitions, intervalDays: 6, easiness: updatedEasiness };

  return {
    repetitions: updatedRepetitions,
    intervalDays: Math.round(previousIntervalDays * updatedEasiness),
    easiness: updatedEasiness,
  };
}

export async function recordReview({ userId, word, quality }) {
  const normalizedWord = word.toLowerCase().replace(/[^a-z'-]/gi, '');
  const score = Math.max(0, Math.min(5, Number(quality)));

  const existing = await query(
    `SELECT error_count, repetitions, easiness_factor, interval_days
     FROM user_progress
     WHERE user_id = $1 AND word = $2
     LIMIT 1`,
    [userId, normalizedWord]
  );

  const current = existing.rows[0] ?? {
    error_count: 0,
    repetitions: 0,
    easiness_factor: 2.5,
    interval_days: 1,
  };

  const next = nextReviewIntervalDays(
    current.repetitions,
    Number(current.easiness_factor),
    score,
    Number(current.interval_days)
  );

  const nextReviewAt = new Date(Date.now() + next.intervalDays * 24 * 60 * 60 * 1000);
  const nextErrorCount = score < 3 ? Number(current.error_count) + 1 : Number(current.error_count);

  await query(
    `INSERT INTO user_progress (user_id, word, error_count, next_review_at, repetitions, easiness_factor, interval_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, word) DO UPDATE SET
       error_count = EXCLUDED.error_count,
       next_review_at = EXCLUDED.next_review_at,
       repetitions = EXCLUDED.repetitions,
       easiness_factor = EXCLUDED.easiness_factor,
       interval_days = EXCLUDED.interval_days`,
    [userId, normalizedWord, nextErrorCount, nextReviewAt, next.repetitions, next.easiness, next.intervalDays]
  );

  return {
    user_id: userId,
    word: normalizedWord,
    next_review_at: nextReviewAt.toISOString(),
    repetitions: next.repetitions,
    easiness_factor: next.easiness,
    interval_days: next.intervalDays,
    error_count: nextErrorCount,
  };
}

export async function getDueReviews(userId) {
  const result = await query(
    `SELECT user_id, word, error_count, next_review_at, repetitions, easiness_factor, interval_days
     FROM user_progress
     WHERE user_id = $1 AND next_review_at <= NOW()
     ORDER BY next_review_at ASC
     LIMIT 200`,
    [userId]
  );

  return result.rows;
}
