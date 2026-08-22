-- SvaraONE Phase 5B: allow an existing subscription to be marked superseded
-- when a paid upgrade creates the user's new active subscription.
-- The application uses status='upgraded' for the old subscription so the
-- historical record is preserved without treating the upgrade as a customer
-- cancellation or an expired billing period.

PRAGMA foreign_keys = OFF;

CREATE TABLE subscriptions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter','creator','pro','studio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','cancelled','expired','upgraded')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_reference TEXT,
  billing_currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'year' CHECK (billing_interval IN ('year')),
  current_period_start TEXT,
  current_period_end TEXT,
  period_start TEXT,
  period_end TEXT,
  payfast_payment_id TEXT,
  payfast_token TEXT,
  amount_zar REAL,
  amount_net_zar REAL,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO subscriptions_new (
  id,user_id,plan,status,stripe_customer_id,stripe_subscription_id,stripe_payment_reference,
  billing_currency,billing_interval,current_period_start,current_period_end,period_start,period_end,
  payfast_payment_id,payfast_token,amount_zar,amount_net_zar,paid_at,created_at,updated_at
)
SELECT
  id,user_id,plan,status,stripe_customer_id,stripe_subscription_id,stripe_payment_reference,
  billing_currency,billing_interval,current_period_start,current_period_end,period_start,period_end,
  payfast_payment_id,payfast_token,amount_zar,amount_net_zar,paid_at,created_at,updated_at
FROM subscriptions;

DROP TABLE subscriptions;
ALTER TABLE subscriptions_new RENAME TO subscriptions;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON subscriptions(stripe_customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_payfast_payment_id
  ON subscriptions(payfast_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token
  ON subscriptions(payfast_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
  ON subscriptions(user_id)
  WHERE status IN ('active','past_due');

PRAGMA foreign_keys = ON;
