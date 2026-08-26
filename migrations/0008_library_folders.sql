-- SvaraONE Library folders: persistent D1 folder relationships for user generations
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS library_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_library_folders_user_created
  ON library_folders(user_id, created_at ASC);

ALTER TABLE generations ADD COLUMN folder_id TEXT REFERENCES library_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generations_folder
  ON generations(user_id, folder_id);
