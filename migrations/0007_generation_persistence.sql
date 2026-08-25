-- SvaraONE generation persistence: D1 metadata + R2 audio lifecycle
-- Apply with: npx wrangler d1 migrations apply svaraone-db --remote

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  parent_generation_id TEXT,
  take_number INTEGER NOT NULL DEFAULT 1 CHECK (take_number >= 1),

  voice_id TEXT NOT NULL,
  provider_voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL DEFAULT '',

  script TEXT NOT NULL,
  character_count INTEGER NOT NULL CHECK (character_count >= 0),
  speed REAL NOT NULL DEFAULT 1.0,
  stability REAL NOT NULL DEFAULT 50.0,
  style TEXT NOT NULL DEFAULT '',

  format TEXT NOT NULL CHECK (format IN ('mp3','wav','pcm')),
  mime_type TEXT NOT NULL,

  credits_charged INTEGER NOT NULL DEFAULT 0 CHECK (credits_charged >= 0),
  credit_reference_id TEXT,
  is_free_take INTEGER NOT NULL DEFAULT 0 CHECK (is_free_take IN (0,1)),

  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','ready','failed','storage_failed')),

  r2_key TEXT,
  r2_etag TEXT,
  size_bytes INTEGER,

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at TEXT,
  expires_at TEXT NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_generation_id) REFERENCES generations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created
  ON generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generations_user_expires
  ON generations(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_generations_expires_status
  ON generations(expires_at, status);

CREATE INDEX IF NOT EXISTS idx_generations_parent
  ON generations(parent_generation_id);

CREATE INDEX IF NOT EXISTS idx_generations_r2_key
  ON generations(r2_key);

CREATE INDEX IF NOT EXISTS idx_generations_credit_reference
  ON generations(credit_reference_id);
