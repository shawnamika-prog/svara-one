# SvaraONE Compose — Pre-S15 Handover

**Date:** 2026-10-12  
**Repository:** `shawnamika-prog/svara-one`  
**Branch:** `main`  
**Current frontend file:** `public/js/studio-landing.js` (current main blob: `5c1a43eea9f8ca70e14d9f7960ac378afcd51ed7`)  
**Current tracker:** `docs/SVARAONE_SOUND_MASTER_TRACKER.md`  
**Current status:** Hold S15 until the pre-S15 Compose amendments are tested and finished.

## User-confirmed working

- Compose multi-track editor baseline remains the known-working S14 foundation.
- Compose & Export workflow works in the deployed app: export, preview and download; WAV, MP3 and PCM are user-confirmed.
- Composition mini-library is integrated with listing/search, preview, download and Use in Compose.
- When deleting the final track, Compose returns to the empty state showing only the main **+ Add Track** button. The timeline ruler and Play All panel are removed.
- Compose preview has its own blue modal, separate from the green/teal My Library preview. It has a compact waveform, live audio-reactive bars, download and close controls.
- Clicking **COMPOSE & EXPORT** stops the transport/all tracks before opening export.

## Current same-lane Cut implementation — pushed, awaiting user regression test

Cut has been refactored from creating a second track row to creating **separate clip regions within the existing track lane**. Delete removes the selected clip when multiple clips exist; deleting the only clip still follows the track deletion/reset behaviour.

Recent relevant commits:
- `09f52c1fcf2607072baec2d5524107302a8bf9d7` — split clips within the existing Compose track lane.
- `fb1d2a10857005bd1d760afa0227c8e0434d83b9` — delete selected clip without removing the whole track.
- `734a3fcb0edfce8ec129c6fb95e42794d8aaa0a9` — stabilize clip playhead at cut boundaries.
- `922c58a1ddc59e679464156580118965bb2ea597` — track same-lane cut playhead stability fix.
- `132f9bc253fb082df315a648ea6665a1328befbb` — split exact audible range to stabilize trimmed-clip playheads.
- `af89194363e449ed8f76bb4cc479fa2d12c7b6dc` and `555225025e30d949841b08a5e4cc2b43f363f82a` — clarify audible-range cut/source-boundary semantics in the architecture notes.
- `2f1051ce2d8edf393ae91988231fcabe876471f6` — one lane-level shared playhead; Play, Move and Cut target the selected clip, and individual playback stops at the selected clip boundary.
- `23799d2e2cc01880b6296938ed71eb794614a3c1` — fix selected-clip object identity and make trim waveform, region width and timeline duration use the same effective audible interval.
- `d69640d9eca345a4ce142d7825bf170eee2c8e01` — move the timeline start with trim-in edits so the left edge and audible range stay aligned.

The latest source fix addresses two reported regressions: selected clip identity/visible selection, and inconsistent trim-aware waveform width versus timeline duration. JavaScript syntax passes, but deployed browser behavior remains unverified. Ask the user to retest with an original asset longer than 30 seconds and trim/cut several clips before making further changes.

### Cut behaviour now intended

- The cut position comes from the track's local audio playhead.
- The currently audible source interval is split into two adjacent clip regions in the same lane.
- Both clips reference the same original source; source media is not duplicated or modified.
- Clip regions have per-clip waveform/trim handles and selection. Play, Move, Cut, Delete and Trim target the selected clip; Delete removes only the selected region when more than one remains.
- Each track lane has one shared visible playhead marker, not one marker per clip. The marker is positioned on the lane timeline and crosses clip boundaries without blinking.
- Trimmed waveforms display the effective audible source interval; visible region width, gap placement and timeline duration all use effective clip duration. Trim drag is delta-based so the handle movement remains stable as the region resizes; trim-in also shifts the clip's timeline start to keep the left edge and audible range aligned.
- Selected clips receive a visible outline, and cloned clip visuals retain the exact object identity used by selection, movement, playback and deletion.
- Individual Play is limited to the selected clip; Play All continues to use the master composition timeline. Track-wide volume, fades, mute and solo remain track properties.
- Playback and export use per-clip source ranges and timeline positions; exact clip boundaries should avoid playhead jumps and trim-percentage drift.
- Cut is unavailable during Play All.
- After cut, test local track playhead behaviour, clip selection, trim handles, Play All, Stop All, export and Delete. Ask the user for the exact observed regression before making another speculative playhead change.

## Pre-S15 amendments still outstanding

1. **Compose workspace UI polish:** user will specify remaining layout changes. The last supplied image identified the final-track-delete empty-state issue, which has already been fixed.
2. **Cut / clip editor regression:** selected-clip Play/Move/Cut/Delete/Trim and one shared lane playhead are pushed; await user test before further change.
3. **SvaraONE playback controls:** current playback controls were described by user as Bootstrap-style; restyle to native SvaraONE styling. Preserve behaviour.
4. **Composition mini-library visual match:** user wants it to look exactly like Sound History/mini-library and said they will provide a reference screenshot later. Do not guess this redesign before receiving the image.

## Phase order

**Test current same-lane Cut/playhead implementation → fix only observed regressions → finish Compose workspace UI → replace Bootstrap-style playback controls → use user's screenshot to match Composition mini-library to Sound → run regression tests for Compose/playback/export/preview/download → only then start S15.**

S15 has not been started. Its future scope is editable composition persistence (composition state, track/clip arrangement and supported edits, referencing existing R2 assets without duplicating audio). Inspect current D1 schema/ownership conventions before designing persistence.

## Guardrails

- Backend is Cloudflare/Workers + R2; do not introduce Supabase.
- Do not destabilize the working S14 editor, export pipeline or shared source assets.
- Do not claim browser/live verification has passed until user reports testing.
- Keep changes focused, syntax-check, update the tracker and push to `main`.
