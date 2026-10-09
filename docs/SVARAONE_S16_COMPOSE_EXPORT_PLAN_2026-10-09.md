# SvaraONE S16.1 — Compose & Export Plan

**Date:** 2026-10-09  
**Branch:** main  
**Status:** Approved plan; implementation has not started  
**Scope:** First complete Composition render/export path — WAV to R2

## Product decision

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
4. **Encode a valid WAV.** Confirm the render produces a real WAV file, not a renamed or concatenated source file. Prefer reusing existing supported audio utilities if the repository already has a suitable encoder; otherwise implement or add only the smallest justified WAV-encoding layer.
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
