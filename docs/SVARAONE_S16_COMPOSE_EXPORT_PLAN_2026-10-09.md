# SvaraONE S16.1 — Compose & Export Plan

**Date:** 2026-10-09  
**Branch:** main  
**Status:** S16.1 code pushed to main; static syntax and WAV-header checks passed; live Cloudflare/R2 round-trip verification pending  
**Scope:** First complete Composition render/export path — WAV to R2

## Product decision

## Implementation delivered

- Added **COMPOSE & EXPORT** to the Compose workspace header, separate from Play All / Stop All. It remains disabled until playable track assets are present.
- The export panel defaults to `svaraone-composition-YYYY-MM-DD-HH-MM.wav`; WAV is the only active format.
- The browser fetches and decodes selected source assets, then uses `OfflineAudioContext` to render one stereo mix with track start positions, trim boundaries, fade in/out, volume, mute and solo state applied. Source assets and live editor state are not modified.
- The result is encoded as standard RIFF/WAVE, 16-bit PCM, stereo, 44.1 kHz. A master peak adjustment is applied only when needed to keep the output below clipping.
- `POST /api/compositions/export` authenticates the user, streams and validates the WAV header/length, enforces an 80 MB upload cap, and writes to `users/{userId}/compositions/{uuid}.wav` in the existing `GENERATED_AUDIO` R2 bucket. Follow-up fix after the first deployed 502: include the exact WAV byte count and bridge the validating stream through Cloudflare `FixedLengthStream`, because R2 requires a readable stream with a known length. Minimal asset metadata is stored on the R2 object; no D1 schema migration or S15 composition-state persistence was added.
- `GET /api/compositions/assets/{id}` authenticates and scopes retrieval to the signed-in user's key, supports byte ranges for audio playback/scrubbing, and supports `?download=1` for attachment download.
- Current safety limit: 7 minutes / 80 MB. MP3/PCM and the Composition mini-library remain deferred.

## Verification status

- JavaScript syntax checks: passed for `public/js/studio-landing.js` and `worker/entry.js`, including the R2 stream-length fix.
- WAV encoder check: passed for RIFF/WAVE identifiers, stereo channel count, 44.1 kHz sample rate, 16-bit PCM and consistent data/RIFF lengths.
- **Not yet confirmed:** a signed-in browser export against the deployed Cloudflare Worker and live R2, followed by playback and download of that saved object. Treat this as pending until that real round trip is exercised.


Compose needs a clear **COMPOSE & EXPORT** action in the workspace header, separate from track controls.

- **Play All / Stop All** previews and stops the current composition in the editor.
- **COMPOSE & EXPORT** renders a finished audio asset; it must not change the Play All / Stop All contract.
- The action opens a compact export panel/modal with a filename and format choice.
- S16.1 supports **WAV only**. Do not imply MP3 or PCM are ready; add them only after the WAV path is verified.
- Suggested default filename: `svaraone-composition-YYYY-MM-DD-HH-MM.wav`.

## S16.1 implementation sequence

1. **Inspect before changing code.** Recheck the current Compose model and the existing Voice/Sound R2, authentication, media retrieval, download/range and D1 patterns. Do not assume endpoint names or introduce an unrelated storage system.
2. **Add the export entry point.** Place **COMPOSE & EXPORT** in the Compose workspace header, not on an individual track. Keep Play All/Stop All in the Tracks transport area. The export panel should validate the filename and offer WAV for this first iteration.
3. **Render from the shared composition timeline.** Use each track's current asset reference, position, effective duration/trim state, fades, volume, mute and solo. Mix into one output without modifying the source assets or the live editor state.
4. **Encode a valid WAV.** Implemented: standard RIFF/WAVE 16-bit PCM, stereo, 44.1 kHz output, followed by a header/length-validated authenticated upload. The deployed round-trip still needs live verification.
5. **Persist through the existing Cloudflare/R2 pattern.** Upload via an authenticated Worker endpoint so the client never receives R2 credentials. Use a Composition-specific key namespace, such as `users/{userId}/compositions/...`. Inspect current bindings and migration/schema conventions before deciding how the minimum export metadata is stored; do not implement full S15 composition-state persistence here.
6. **Return a usable asset.** Provide an authenticated playback/download path with correct WAV MIME type, filename, ownership checks, and byte-range behaviour consistent with existing media endpoints.
7. **Verify the full round trip.** Export one composition, retrieve the saved object from R2, play it, download it, and verify it is valid WAV. Test that one user's asset cannot be read by another user and that export failure is surfaced honestly.

## Acceptance criteria

- Export is a separate user action from Play All/Stop All.
- Track timing and supported non-destructive edits are reflected in the rendered mix.
- Source Voice/Sound assets remain unchanged.
- Output is valid WAV and plays after being retrieved from R2.
- The authenticated user can download the output with the default filename.
- The R2 object is stored under a Composition-specific, user-scoped key.
- Failure states do not present an unpersisted render as successfully saved.
- Existing S14 playback, transport, navigation and track-editing behaviour remains unchanged.

## Explicitly deferred

- MP3 and PCM export, until WAV is verified end-to-end.
- Composition mini-library, until real exported Composition assets can be browsed/reused.
- Full S15 persistence of editable composition state and track references.
- Changes to Voice/Sound generation behaviour.
- Any changes to the locked S14 baseline beyond the minimal integration needed to expose the export action.

## Dependency order

**S14 locked editor → S16.1 render/export WAV → verified R2 Composition asset → later MP3/PCM support → Composition mini-library.**
