import express from 'express';
import cors from 'cors';
import { generateExercises, getExercisesByVideo } from './controllers/exercises.controller.js';
import { getVocabulary } from './controllers/vocabulary.controller.js';
import { listDueReviews, reviewWord } from './controllers/srs.controller.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/exercises/generate', async (req, res, next) => {
  try {
    await generateExercises(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/api/exercises/video/:videoId', async (req, res, next) => {
  try {
    await getExercisesByVideo(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/api/vocab/:word', async (req, res, next) => {
  try {
    await getVocabulary(req, res);
  } catch (error) {
    next(error);
  }
});

app.post('/api/srs/review', async (req, res, next) => {
  try {
    await reviewWord(req, res);
  } catch (error) {
    next(error);
  }
});

app.get('/api/srs/due/:userId', async (req, res, next) => {
  try {
    await listDueReviews(req, res);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Rule-based backend listening on http://localhost:${port}`);
});
