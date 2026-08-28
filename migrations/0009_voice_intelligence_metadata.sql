-- SvaraONE 3F: provider voice intelligence metadata.
-- Keep voice_registry unchanged. This table normalizes provider metadata
-- into queryable fields while retaining the raw provider payload.

CREATE TABLE IF NOT EXISTS voice_intelligence_metadata (
  svara_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'deepgram',
  provider_voice_id TEXT NOT NULL UNIQUE,
  provider_model TEXT NOT NULL DEFAULT 'aura-2',
  characteristics_json TEXT NOT NULL DEFAULT '[]',
  use_cases_json TEXT NOT NULL DEFAULT '[]',
  raw_metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (svara_id) REFERENCES voice_registry(svara_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_voice_intelligence_provider_voice
  ON voice_intelligence_metadata(provider_voice_id);

CREATE INDEX IF NOT EXISTS idx_voice_intelligence_provider_model
  ON voice_intelligence_metadata(provider, provider_model);

-- Query-friendly membership indexes. SQLite JSON1 is available in D1.
CREATE INDEX IF NOT EXISTS idx_voice_intelligence_use_cases
  ON voice_intelligence_metadata(use_cases_json);
