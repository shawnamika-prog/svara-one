# Svara V2

Global AI voice creation platform foundation.

## What changed

- Global positioning; South African voices remain a featured collection.
- New Svara mark and visual direction.
- Studio voice catalogue uses Svara-owned IDs and provider mappings.
- Deepgram moved behind a provider adapter.
- Worker CORS is allow-listed.
- Provider errors are sanitized for users.
- 10,000-character generation ceiling for the V2 prototype.
- Studio estimates usage in Svara Credits.
- Audio is returned once as MP3 rather than re-generating for a second format.
- Supabase/R2 integration is intentionally left as the next production layer because credentials/bindings are environment-specific.

## Current provider

Deepgram Aura-2 remains the default adapter. The provider interface is deliberately small so Murf, Fish, Cartesia or another engine can be added without changing the Studio API.

## Production next steps

1. Connect Supabase Auth.
2. Add users, subscriptions, credit ledger, projects and generations.
3. Add Cloudflare R2 binding and persistent audio assets.
4. Add Stripe checkout/webhooks.
5. Add rate limiting and abuse controls.
6. Add provider adapters and run the Svara voice bake-off.
7. Replace placeholder pricing/voice metadata with the final commercial catalogue.
