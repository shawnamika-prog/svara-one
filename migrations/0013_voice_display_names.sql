-- Persistent user-defined display names for Voice History assets.
-- Keep the R2 object key stable; display names are presentation metadata only.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS voice_display_names (
  generation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (generation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_display_names_user
  ON voice_display_names(user_id);
