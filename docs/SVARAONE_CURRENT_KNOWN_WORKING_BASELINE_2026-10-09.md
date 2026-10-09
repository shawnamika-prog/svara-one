# SvaraONE Current Known-Working Baseline — 2026-10-09

**Branch:** main  
**Baseline commit:** `eb0f41f604609413c6f5070eaf6e39a69512c6f4`  
**Commit:** S14.3: render real source waveforms

## Baseline status

This is the current confirmed known-working SvaraONE baseline.

The S14 Compose workspace has been tested and confirmed working. No further S14 feature expansion is required at this point.

## Locked product direction

The current Compose workspace is intentionally kept as-is. Do not add timeline zoom, cut/trim, or other DAW complexity unless a real workflow problem demonstrates that it is necessary.

The Compose workspace currently provides:

- shared master composition timeline
- true source waveform rendering
- Voice and Sound tracks on one timeline
- true source durations
- track positioning
- horizontal timeline scrolling
- master Play All / Stop All
- master playhead
- individual track playback
- volume, mute, solo and fades
- persistent Compose workspace during navigation
- transport cleanup when leaving/re-entering Compose
- fixed track controls while the timeline scrolls

## Next roadmap

### S13 — Composition mini-library

Add a small library inside the relevant workflow showing **compositions only**, analogous to the existing Sound mini-library.

It is not a duplicate track library. Individual Voice/Sound assets remain their existing assets.

### S14 — Compose

Consider the current Compose implementation the working baseline. No additional feature phase is required before moving forward.

### S15 — Composition persistence

Persist the user's **composition records**, not duplicate individual track media.

A composition stores references to existing R2 Voice/Sound assets plus the user's composition state and edits, such as:

- track order
- track references
- position
- volume
- mute/solo
- fades
- other supported composition controls

The source media remains in R2.

### S16 — Composition render/export

Render the composition using the existing referenced tracks and the user's composition edits.

Required outputs:

- WAV
- MP3

The rendered composition is:

1. downloadable by the user
2. stored in R2
3. named by default as `svaraone-composition-YYYY-MM-DD-HH-MM`

### S17 — My Library

Extend My Library into the central asset-management workspace for:

- Voice
- Sound
- Composition

Users should have full control over these asset types through one consistent library experience.

### S18–S22

Do not predefine these phases yet. First inspect the functionality that exists when S17 is complete, then deliberately decide what comes next.

## Baseline rule

All future work continues from this commit/state unless an explicitly agreed newer baseline replaces it.
