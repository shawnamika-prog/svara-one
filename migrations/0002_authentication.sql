-- SvaraONE Phase 1B: password authentication
-- Apply through the Cloudflare D1 dashboard Console before testing auth.

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE);
