-- Persistent user-defined display names for exported Composition History assets.
-- R2 object keys and rendered audio are deliberately unchanged.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS composition_display_names (
  composition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (composition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_composition_display_names_user
  ON composition_display_names(user_id);
