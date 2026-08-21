-- SvaraONE Phase 1: account and billing foundation
-- Apply with: npx wrangler d1 migrations apply svaraone-db --remote

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter','creator','pro','studio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','cancelled','expired')),
  stripe_customer_id TEXT,
  stripe_payment_reference TEXT,
  billing_currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'year' CHECK (billing_interval IN ('year')),
  period_start TEXT,
  period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id TEXT,
  period_key TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created ON credit_ledger(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON credit_ledger(reference_id);

CREATE TABLE IF NOT EXISTS user_voices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  revoked_at TEXT,
  UNIQUE (user_id, voice_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);

CREATE TABLE IF NOT EXISTS account_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  reference_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_account_events_user_created ON account_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_account_events_reference ON account_events(reference_id);
