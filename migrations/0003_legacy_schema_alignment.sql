-- SvaraONE Phase 1C: align the pre-existing D1 session/billing tables.
-- The database was initially created from an earlier schema. CREATE TABLE IF NOT EXISTS
-- does not alter those existing tables, so authentication needs these missing columns.

ALTER TABLE sessions ADD COLUMN token_hash TEXT;
ALTER TABLE sessions ADD COLUMN revoked_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

ALTER TABLE subscriptions ADD COLUMN stripe_payment_reference TEXT;
ALTER TABLE subscriptions ADD COLUMN billing_currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE subscriptions ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'year';
ALTER TABLE subscriptions ADD COLUMN period_start TEXT;
ALTER TABLE subscriptions ADD COLUMN period_end TEXT;

