# SvaraONE Payfast Sandbox Setup

This integration is intentionally sandbox-first. Live Payfast is not selected by default.

## Cloudflare Worker variables

Add these as Worker environment variables:

- `PAYFAST_SANDBOX` = `true`
- `SVARAONE_PAYFAST_ZAR_PER_USD` = your chosen ZAR base-rate used to translate the public USD plan price into the Payfast ZAR transaction amount

Keep the existing SvaraONE pricing variables unchanged.

## Cloudflare secrets

Add these as encrypted Worker secrets:

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`

Use the Payfast Sandbox credentials only.

## D1 migration

Apply `migrations/0004_payfast_billing.sql` manually in the Cloudflare D1 dashboard before testing a successful payment. It is additive only; it does not recreate or delete any existing table.

## Payfast dashboard

Enable Multi-Currency Pricing and enable USD for the merchant account when the account is eligible. Payfast's MCP presents the buyer with a currency selector and converts the ZAR base amount at checkout; settlement is in ZAR.

## Important pricing note

Payfast MCP converts from a ZAR base amount using Payfast's exchange rate. Therefore the `SVARAONE_PAYFAST_ZAR_PER_USD` variable controls the ZAR amount SvaraONE sends to Payfast, but it cannot guarantee that the buyer will see an exact fixed USD amount after Payfast's own conversion. Do not switch to live payments until this pricing behavior has been accepted as a business decision.

## Sandbox test flow

1. Log into a SvaraONE account.
2. Choose a paid plan.
3. The billing page calls `/api/payments/payfast/checkout`.
4. The Worker creates a signed Payfast Sandbox request.
5. Payfast returns to `/billing.html` after checkout.
6. Payfast ITN calls `/api/payments/payfast/itn`.
7. The Worker verifies the signature and Payfast validation response.
8. D1 activates the annual subscription, allocates the first monthly credit amount, and grants the plan's voices.
9. The hourly Cloudflare Cron Trigger allocates the next monthly credit period while the annual subscription remains active.
