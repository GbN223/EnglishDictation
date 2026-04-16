import { randomUUID } from 'node:crypto';
import { createClozeExercises } from '../services/cloze-generator.service.js';
import { query } from '../db/pool.js';

export async function generateExercises(req, res) {
  const { text = '', videoId = null, title = null } = req.body ?? {};
  if (!String(text).trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const generated = createClozeExercises(String(text));

  if (!videoId) {
    res.json({ exercises: generated });
    return;
  }

  const safeVideoId = String(videoId);
  const videoInsert = await query(
    `INSERT INTO videos (id, youtube_id, title, processed_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (youtube_id) DO UPDATE SET title = EXCLUDED.title, processed_at = NOW()
     RETURNING id`,
    [randomUUID(), safeVideoId, title ?? safeVideoId]
  );
  const dbVideoId = videoInsert.rows[0].id;

  await query('DELETE FROM exercises WHERE video_id = $1', [dbVideoId]);
  for (const exercise of generated) {
    await query(
      `INSERT INTO exercises (
        id, video_id, sentence_text, masked_sentence, start_time, end_time, blanks_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        randomUUID(),
        dbVideoId,
        exercise.sentence_text,
        exercise.masked_sentence,
        exercise.start_time,
        exercise.end_time,
        JSON.stringify(exercise.blanks_json),
      ]
    );
  }

  res.json({ video_id: dbVideoId, exercises: generated });
}

export async function getExercisesByVideo(req, res) {
  const { videoId } = req.params;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
  const offset = (page - 1) * limit;

  const rows = await query(
    `SELECT id, sentence_text, masked_sentence, start_time, end_time, blanks_json
     FROM exercises
     WHERE video_id = $1
     ORDER BY start_time ASC, id ASC
     LIMIT $2 OFFSET $3`,
    [videoId, limit, offset]
  );

  const totalResult = await query(
    'SELECT COUNT(*)::int AS total FROM exercises WHERE video_id = $1',
    [videoId]
  );
  const total = totalResult.rows[0]?.total ?? 0;
  const hasMore = offset + rows.rows.length < total;

  const blocks = rows.rows.length > 0
    ? [
        {
          blockId: page,
          sentences: rows.rows.map((row) => ({
            id: row.id,
            original: row.sentence_text,
            blanks: row.blanks_json,
          })),
        },
      ]
    : [];

  res.json({
    page,
    limit,
    total,
    hasMore,
    blocks,
  });
}
