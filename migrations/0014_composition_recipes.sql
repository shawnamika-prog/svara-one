-- S15: Persist editable Compose recipes separately from rendered R2 exports.
-- A recipe references source assets by stable IDs; it does not duplicate audio.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS composition_recipes (
  composition_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  recipe_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (composition_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (schema_version >= 1),
  CHECK (json_valid(recipe_json))
);

CREATE INDEX IF NOT EXISTS idx_composition_recipes_user_updated
  ON composition_recipes(user_id, updated_at DESC);
