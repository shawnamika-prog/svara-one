-- SvaraONE Phase 5A: Payfast payment references for annual paid plans.
-- Safe additive migration. Do not drop or recreate existing billing tables.

ALTER TABLE subscriptions ADD COLUMN payfast_payment_id TEXT;
ALTER TABLE subscriptions ADD COLUMN payfast_token TEXT;
ALTER TABLE subscriptions ADD COLUMN amount_zar REAL;
ALTER TABLE subscriptions ADD COLUMN amount_net_zar REAL;
ALTER TABLE subscriptions ADD COLUMN paid_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_payfast_payment_id
  ON subscriptions(payfast_payment_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_token
  ON subscriptions(payfast_token);
