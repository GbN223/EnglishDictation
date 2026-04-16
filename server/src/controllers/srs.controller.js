import { getDueReviews, recordReview } from '../services/srs.service.js';

export async function reviewWord(req, res) {
  const { userId, word, quality } = req.body ?? {};
  if (!userId || !word || quality === undefined) {
    res.status(400).json({ error: 'userId, word, and quality are required' });
    return;
  }

  const result = await recordReview({ userId: String(userId), word: String(word), quality: Number(quality) });
  res.json(result);
}

export async function listDueReviews(req, res) {
  const { userId } = req.params;
  const rows = await getDueReviews(userId);
  res.json({ items: rows });
}
