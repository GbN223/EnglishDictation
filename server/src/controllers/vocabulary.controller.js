import { getVocabularyInfo } from '../services/vocabulary.service.js';

export async function getVocabulary(req, res) {
  const { word } = req.params;
  if (!word?.trim()) {
    res.status(400).json({ error: 'word is required' });
    return;
  }

  const data = await getVocabularyInfo(word);
  res.json(data);
}
