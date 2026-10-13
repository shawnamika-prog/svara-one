| # | Phase | Area | Status | Done? | Required work | Success condition |
|---|---|---|---|---|---|---|
| **S0** | Architecture | Overall Sound architecture | 🟢 | **Yes** | Define Sound as independent domain, SvaraFlow/providers/D1/R2/credits/compositions | Architecture approved and locked |
| **S1** | Sound provider abstraction | Provider layer | 🟢 | **Yes** | Provider interface/base contract | Provider abstraction passes testing |
| **S2** | Sound generation service | Backend lifecycle | 🟢 | **Yes** | Generation lifecycle, persistence, statuses, inputs, parameters | Lifecycle works independently of provider |
| **S3** | Sound API | `/api/sound/generate` | 🟢 | **Yes** | Auth, validation, provider, generation, errors | API accepts/rejects and records failures |
| **S4** | Credits | Shared credit system | 🟢 | **Yes** | Reserve / retain / refund | No generation consumes credits incorrectly |
| **S5** | R2 | Shared storage | 🟢 | **Yes** | Successful Sound output to R2, namespaces, metadata | Generated Sound persistently stored/retrievable |
| **S6** | Sound D1 | Sound database | 🟢 | **Yes** | Sound generation/input/parameter/composition persistence | D1 supports lifecycle |
| **S7** | Sound inputs | `sound_generation_inputs` | 🟢 | **Yes** | Text/assets/Voice/etc. inputs | Inputs persisted/passed through |
| **S8** | Sound parameters | Creative parameters | 🟢 | **Yes** | Mood, style, energy, texture, tempo, intensity, complexity, vocals, language, negative/provider-specific parameters, capability-driven parameter representation | Creative intent represented provider-independently and passed through the Sound generation path |
| **S9** | Sound Studio UI | Frontend workspace | 🟢 | **Yes** | Complete conversational SvaraFlow Sound Studio UI, Direct Mode, capability-driven adapter controls, Existing Voice library workflow, voice/script context, proposal presentation, conversation height, interaction polish, and end-to-end generation UX | Sound Studio UI is fully complete and reliable end-to-end |
| **S10** | Output playback | Audio player | 🟢 | **Yes** | Waveform, playback, volume, output controls | User previews Sound |
| **S11** | Existing Voice → Sound | Cross-domain workflow | 🟢 | **Yes** | Existing Voice as Sound input | Voice drives Sound creation |
| **S12** | SvaraFlow Sound | Intelligence/orchestration | 🟢 | **Yes** | Understand content/intent, map to Sound specification/provider capabilities | SvaraFlow prepares Sound requests |
| **S13** | Generation history | Recent generations + Composition mini-library | 🟢 | **Composition mini-library live-confirmed by user** | Composition mini-library is integrated beneath Compose and supports saved R2 asset discovery, search, preview, download and reuse in Compose | User can find, preview, download and reuse saved compositions alongside completed Sound history |
| **S14** | Composition engine | Multi-track composition | 🟢 | **Closed — user-tested and confirmed working** | Compose multi-track editing and transport; Voice, Sound and Compose history libraries; consistent actions, folders, rename/delete, preview/download, and final UI refinements. User has tested all three workspaces and confirmed S14 working. Preserve the current known-good state. | Voice, Sound and Compose work as expected; user confirmed S14 complete |
| **S15** | Composition persistence | Composition DB + reuse workflow | 🟡 | **S15.1 recipe import user-tested; S15.2 draft persistence implemented in code, awaiting migration and live verification** | Existing `0014_composition_recipes.sql` remains intact. New `0015_composition_drafts.sql` adds owner-scoped draft records independent of rendered R2 assets. Authenticated draft APIs save/list/load recipes and validate source ownership. Compose UI adds manual Save, Autosave on by default, configurable 30/60/120-second safety interval, visible save status, unfinished-drafts list and Open draft restoration. Export remains separate from recipe save. User must apply migration 0015 in Cloudflare D1 before using draft endpoints; live API/browser verification remains pending. | User can save and resume an editable draft before export, with tracks/settings restored and original Voice/Sound assets unchanged |
| **S16** | Export | Composition render/export | 🟢 | **S16.1 WAV + S16.2 MP3/PCM — user-confirmed working** | Compose & Export renders WAV, MP3 (LAME, 192 kbps) or raw 16-bit big-endian stereo PCM at 24 kHz, persists to authenticated R2 paths, and supports preview/playback and original-format download. PCM preview is WAV-wrapped. Safety limit 7 minutes / 80 MB | User can export, save, preview and download compositions in all three formats and reuse the saved assets |
| **S17** | My Library | Cross-domain asset management | ⚪ | **Planned** | Extend My Library to provide full control of Voice, Sound and Composition assets | One consistent library gives users full control of all three asset types |
| **S18** | Future | To be determined | ⚪ | **Not defined** | Inspect current functionality after S17, then deliberately define the next requirement | Next phase is based on actual product needs, not assumptions |
| **S19** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S20** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S21** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S22** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |


## Known-working baseline — 2026-10-13

- **Code baseline:** `4bc15d9139fa35e38e55bcff95da1f760e743571` — Composition History file-size units and baseline-assets message fix, including the user-tested S15.1 recipe persistence/import implementation on `main`.
- **Verification:** User confirmed recipe import works and imported tracks retain their user-defined settings. Cloudflare D1 recipe table structure, foreign key, index, JSON validity, schema version and a three-track saved recipe were inspected and confirmed.
- **Scope:** Treat this commit as the current known-working baseline. Do not reset or modify the baseline; future work should build forward from it.
- **Remaining:** S15 is not marked fully closed; broader live verification and explicit S15 closure remain outstanding.

## S15.2 — Persistent Compose drafts (2026-10-13)

- Added `migrations/0015_composition_drafts.sql` for `composition_drafts` with owner-scoped composite primary key, schema version, JSON recipe, display name, timestamps, optional future export reference and user-cascade foreign key.
- Added authenticated Worker endpoints: `GET/POST /api/compositions/drafts` and `GET /api/compositions/drafts/:draftId`. Draft saves validate that every Voice, Sound or Composition source belongs to the authenticated user and is still available.
- Added Compose Save, Autosave (on by default), configurable 30/60/120-second periodic save, debounced edit saves, visible save state, unfinished draft list and draft restore flow. Draft persistence is separate from R2 audio export.
- **Deployment prerequisite:** apply `migrations/0015_composition_drafts.sql` to Cloudflare D1 before testing the new draft UI/API. No D1 mutation was performed by this code change.
- **Verification status:** UI JavaScript and Worker module syntax checks pass after accounting for Worker imports/exports. Follow-up polish standardized Save/Autosave/interval/status sizing, changed Autosave to a switch, and hides the entire control group until at least one track is present. Worker now returns an actionable 503 when `composition_drafts` is missing. Live Worker/D1/browser round-trip is not yet confirmed; apply migration 0015 in Cloudflare D1. Preserve the S14/S15.1 known-working baseline and build forward only.

### S15.3 — Draft completion after export (2026-10-13)

- Added `migrations/0016_composition_draft_completion.sql` to add `completed_at` and a partial index for unfinished drafts. Apply this migration to Cloudflare D1 before deploying/testing the completion workflow.
- Draft list endpoint now returns only records where `completed_at IS NULL`.
- After audio export succeeds and the existing editable recipe save succeeds, the UI calls the owner-authenticated draft completion endpoint. The Worker verifies the exported R2 composition belongs to the authenticated user, then records the composition ID and completion timestamp.
- If export or recipe persistence fails, the draft is retained. If completion fails, the UI warns and the draft remains listed until completion is confirmed.
- **Verification:** UI and Worker syntax checks pass; list filtering, completion endpoint and recipe-before-completion ordering confirmed in source. Live D1/browser round-trip remains pending. Apply migration 0016 before live test.


### S15.4 — Delete unfinished drafts (2026-10-13)

- Added authenticated owner-scoped DELETE `/api/compositions/drafts/:draftId`. Only unfinished drafts can be deleted; completed drafts and Composition History assets are not affected. No source audio is deleted.
- Added a Delete action and confirmation to each Unfinished Compositions row.
- When deleting the currently open draft, the UI first requires the server deletion to succeed, then stops playback, removes the timeline and inline track controls, restores the empty Compose canvas, clears the active draft ID and dirty/save state, and cancels pending debounce/periodic autosave work. An in-flight save blocks deletion to avoid a save/delete race.
- On deletion failure, the active workspace is preserved and the user is shown an error.
- **Verification:** source edits are pushed to main; live browser/Worker/D1 testing remains for the user. Migration 0016 must be applied for the current draft completion schema.
