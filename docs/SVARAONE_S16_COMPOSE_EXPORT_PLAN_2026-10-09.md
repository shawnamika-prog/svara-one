# SvaraONE S16.1 — Compose & Export

**Date:** 2026-10-09  
**Branch:** main  
**Status:** WAV-to-R2 export implemented; live export confirmed working by user  
**Scope:** First complete Composition render/export path — WAV to R2

## Product behaviour

- **Play All / Stop All** previews and stops the composition in the editor.
- **COMPOSE & EXPORT** is a separate action in the Compose workspace header.
- Export opens a panel with an editable filename and WAV format details.
- The default filename is `svaraone-composition-YYYY-MM-DD-HH-MM.wav`.
- WAV is the only enabled format in S16.1. MP3 and PCM remain deferred until their paths are implemented and tested.

## Implemented

1. The browser fetches and decodes the source assets and uses `OfflineAudioContext` to render one stereo mix.
2. Track positions, trim boundaries, fade in/out, volume, mute and solo state are included in the mix. The source assets and live editor state are not modified.
3. The result is encoded as RIFF/WAVE, 16-bit PCM, stereo, 44.1 kHz. A master peak adjustment is applied only when needed to reduce clipping risk.
4. `POST /api/compositions/export` authenticates the user, validates the WAV header and byte length, enforces an 80 MB limit, and writes the asset to `users/{userId}/compositions/{uuid}.wav` in the existing `GENERATED_AUDIO` R2 bucket. The upload stream uses the declared byte length with Cloudflare `FixedLengthStream`.
5. Minimal export metadata is stored on the R2 object; full S15 composition-state persistence and a D1 migration were not added.
6. `GET /api/compositions/assets/{id}` authenticates and scopes retrieval to the signed-in user's namespace, supports byte ranges and audio playback, and supports `?download=1` for attachment download.
7. Current safety limit: 7 minutes / 80 MB.

## Verification record

- JavaScript syntax checks passed for `public/js/studio-landing.js` and `worker/entry.js`.
- The WAV encoder test passed for RIFF/WAVE identifiers, stereo channel count, 44.1 kHz sample rate, 16-bit PCM and consistent RIFF/data lengths.
- The first deployed upload attempt returned 502. The request now sends the exact WAV byte length and the Worker bridges the validated stream through `FixedLengthStream`.
- **User confirmed the Compose & Export flow is now working in the deployed app.** The live success is user-confirmed; no separate test report for cross-user access isolation is recorded here.

## Acceptance criteria

- Export is separate from Play All / Stop All.
- Render reflects the composition's track timing and supported non-destructive edits.
- Source Voice/Sound assets remain unchanged.
- The resulting WAV is saved under a Composition-specific, user-scoped R2 key.
- The signed-in user can retrieve/play the saved asset and request a download.
- Failed exports do not report success.
- S14 transport and track editing remain unchanged.

## Deferred

- MP3 and PCM export.
- Composition mini-library, until the real exported assets can be browsed and reused.
- Full S15 persistence of editable composition state and source-track references.
- Changes to Voice/Sound generation behaviour.

## Dependency order

**S14 locked editor → S16.1 WAV-to-R2 export → MP3/PCM support → Composition mini-library.**
