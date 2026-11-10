-- Beyaz yaka kariyer koçu: ilk şema
-- Kişisel veri en aza indirilir: ad, şirket adı, e-posta burada tutulmaz (e-posta Firebase'de kalır).
-- Prova sohbetleri sunucuda saklanmaz.

CREATE TABLE users (
  id TEXT PRIMARY KEY,                 -- Firebase UID
  created_at INTEGER NOT NULL,
  age_confirmed INTEGER NOT NULL DEFAULT 0,
  role TEXT,
  sector TEXT,
  experience TEXT,
  needs TEXT NOT NULL DEFAULT '[]',    -- JSON dizi
  trial_ends_at INTEGER NOT NULL,
  sub_until INTEGER NOT NULL DEFAULT 0,
  cv_credits INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE wins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
CREATE INDEX wins_user ON wins(user_id, created_at DESC);

CREATE TABLE outputs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX outputs_user_tool ON outputs(user_id, tool, created_at DESC);

CREATE TABLE usage_daily (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE spend_daily (
  day TEXT PRIMARY KEY,
  usd REAL NOT NULL DEFAULT 0
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
