-- S15: Mark drafts complete after a verified export and recipe save.
ALTER TABLE composition_drafts ADD COLUMN completed_at TEXT;
CREATE INDEX IF NOT EXISTS idx_composition_drafts_user_unfinished
  ON composition_drafts(user_id, updated_at DESC)
  WHERE completed_at IS NULL;
