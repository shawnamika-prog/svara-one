# V2 deployment fix

The `workers.dev` URL was returning 404 because the Worker handled `/api/*` but did not
fall through to Cloudflare's static asset binding for `/`.

V2 now:
- exposes the static app through the `assets` binding
- falls through to `env.ASSETS.fetch(request)` for non-API routes
- keeps `/api/*` handled by the Worker

Deploy from this folder with Wrangler. Set `DEEPGRAM_API_KEY` as a Worker secret.

If you are using Cloudflare Pages (not Workers Static Assets), deploy the project as a
Pages project instead and configure the Worker/Pages Function according to that setup.
Do not use both deployment models for the same hostname.
