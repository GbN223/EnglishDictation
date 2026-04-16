CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  sentence_text TEXT NOT NULL,
  masked_sentence TEXT NOT NULL,
  start_time NUMERIC(10, 3) NOT NULL,
  end_time NUMERIC(10, 3) NOT NULL,
  blanks_json JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_exercises_video_id ON exercises(video_id);

CREATE TABLE IF NOT EXISTS static_vocabulary (
  word TEXT PRIMARY KEY,
  cef_level TEXT CHECK (cef_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') OR cef_level IS NULL),
  meaning_vi TEXT
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  error_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repetitions INTEGER NOT NULL DEFAULT 0,
  easiness_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
  interval_days INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_next_review_at ON user_progress(next_review_at);

CREATE TABLE IF NOT EXISTS stopwords (
  word TEXT PRIMARY KEY
);
