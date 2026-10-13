-- S15: Persistent editable Compose drafts independent of rendered R2 exports.
-- Draft recipes store references to owned source assets; they do not duplicate audio.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS composition_drafts (
  draft_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Untitled Composition',
  schema_version INTEGER NOT NULL DEFAULT 1,
  recipe_json TEXT NOT NULL,
  last_exported_composition_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (draft_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (schema_version >= 1),
  CHECK (json_valid(recipe_json))
);

CREATE INDEX IF NOT EXISTS idx_composition_drafts_user_updated
  ON composition_drafts(user_id, updated_at DESC);
