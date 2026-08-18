# Svara V2 — Cloudflare Workers Build

This pack fixes the previous deployment issue.

## Why the previous deployment failed

Wrangler was configured with the repository root (`.`) as the static asset directory. For a Worker + Static Assets deployment, use a dedicated static directory instead.

V2 now uses:
- `public/` — browser-visible HTML/CSS/JS/images
- `worker/` — server-side Worker/API code
- `wrangler.jsonc` — `assets.directory = "./public"`

## Workers Builds deploy command

Keep:

`npx wrangler deploy`

No build command is required.

## Secret

Set `DEEPGRAM_API_KEY` as a Worker secret in Cloudflare.

## Test after deployment

1. `/`
2. `/studio`
3. `/api/health`

The Worker serves static assets through the `ASSETS` binding and handles `/api/*` itself.
