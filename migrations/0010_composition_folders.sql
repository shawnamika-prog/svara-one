-- Persistent folder assignment for exported Composition History assets.
-- Composition audio remains in R2; this table stores only its user's folder association.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS composition_folder_assignments (
  composition_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  folder_id TEXT REFERENCES library_folders(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_composition_folder_assignments_user_folder
  ON composition_folder_assignments(user_id, folder_id);
