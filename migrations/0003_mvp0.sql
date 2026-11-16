-- MVP 0 (16 Kasım 2026): prova turları ayrı sayılır, "işe yaradı mı?" geri bildirimi.
ALTER TABLE usage_daily ADD COLUMN prova_turns INTEGER NOT NULL DEFAULT 0;

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  useful INTEGER NOT NULL,      -- 1: işe yaradı, 0: yaramadı
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX feedback_tool ON feedback(tool, created_at DESC);
