-- V1 Video workspace durable projects, creative direction and progressive workflow state.
CREATE TABLE IF NOT EXISTS video_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled video project',
  current_stage INTEGER NOT NULL DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 6),
  approved_stages_json TEXT NOT NULL DEFAULT '[]',
  project_data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_video_projects_user_updated
  ON video_projects(user_id, updated_at DESC);
