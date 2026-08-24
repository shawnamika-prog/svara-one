CREATE TABLE IF NOT EXISTS voice_registry (
  svara_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'deepgram',
  provider_voice_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  style TEXT NOT NULL DEFAULT 'Natural',
  characteristics_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  sample_key TEXT NOT NULL,
  sample_status TEXT NOT NULL DEFAULT 'missing',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voice_registry_language ON voice_registry(language, active);
CREATE INDEX IF NOT EXISTS idx_voice_registry_provider_voice ON voice_registry(provider_voice_id);
CREATE INDEX IF NOT EXISTS idx_voice_registry_active ON voice_registry(active, display_name);
