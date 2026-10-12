# SvaraONE S14 Compose Architecture Lock

**Date:** 2026-10-09  
**Branch:** main  
**Scope:** S14 Composition Engine only  
**Status:** Architecture approved; implementation begins from this model.

## Why S14 is being reworked

The current Compose workspace is a prototype built around independent track waveform containers and a hard-coded 30-second timeline. That model is not suitable for real composition. A 30-second Voice and a 5-minute Sound must coexist on one composition timeline without either waveform being squeezed into a common 30-second region.

The current waveform bars are also synthetic UI bars rather than a representation of the source audio. The next S14 implementation must therefore establish a true composition editor before further playhead synchronization patches are made.

## Locked model

### Composition

The composition is the parent editor and owns:

- duration
- currentTime
- tracks[]
- timeline zoom / pixelsPerSecond
- master transport state
- master playhead state

Composition duration is derived from the latest effective track end unless an explicit composition end is later introduced.

### Track

A track is positioned inside the composition and does not own a timeline.

Core state:

- asset reference
- track type
- startSeconds
- source duration
- trimIn
- trimOut
- fade in / fade out
- volume
- mute
- solo

Effective end: startSeconds + effectiveTrackDuration

### Asset / waveform

Each imported audio asset has an authoritative source duration and waveform data representing the complete source from beginning to end.

The waveform is not squeezed to the viewport and is not generated from seeded sin/cos bars.

The intended browser implementation is source-audio decoding followed by amplitude/peak extraction. The Web Audio API decodeAudioData() is appropriate for decoding complete fetched audio files into an AudioBuffer. See MDN: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData

### Timeline geometry

The editor uses one shared coordinate system:

x = seconds × pixelsPerSecond

Therefore:

trackX = startSeconds × pixelsPerSecond

waveformWidth = sourceDuration × pixelsPerSecond

A 30-second Voice and a 300-second Sound therefore retain their true relative lengths on the same timeline.

### Master timeline

The ruler belongs to the composition, not to individual tracks.

It must:

- dynamically cover the composition duration
- scroll horizontally for long compositions
- support zoom through pixelsPerSecond
- expose one master playhead
- never assume a 30-second maximum

### Transport authority

There is one authoritative composition clock during Play All:

composition.currentTime

Track visual state is derived from:

localTime = composition.currentTime - track.startSeconds

Track state is therefore explicitly one of:

- before start
- active
- finished

Individual track playback remains supported as a separate local playback mode and must not compete with master transport state.

### Non-destructive editing

Trim, fade, gain, mute, solo and positioning remain track properties. They modify playback/rendering state without modifying the source asset.

**Cut at playhead amendment (pre-S15):** a Cut control sits before Delete. With Play All stopped, Cut uses the track's local audio playhead and creates a second clip region inside the same track lane over the same source asset. The original section and new section receive complementary source ranges and contiguous timeline start positions; Delete removes only the selected clip while other clips remain. When splitting an already-trimmed clip, recalculate each segment's trim percentages against its new source span so the original absolute outer trim points remain unchanged. Preserve track volume, mute and outer fade behaviour; split clips share Solo state. A cut must be strictly inside the currently visible trim range; cutting at or near either edge is rejected.

**Cut-boundary playhead stability:** local playhead/gain selection must use the same exact half-open source interval for each clip (`effectiveStart <= currentTime < effectiveEnd`). Do not subtract different epsilon margins at both ends, as that creates a dead zone at each split and causes marker flicker or an unnecessary media seek. Individual playback may seek over an actual deleted source gap, but must not reposition audio at a shared boundary between adjacent clips. Update playhead rendering on both `timeupdate` and `seeked`.

## Implementation order

1. Composition state/model
2. Master timeline geometry and dynamic duration
3. Track-lane positioning refactor
4. Real source waveform extraction/rendering
5. Master transport
6. Master and track playhead synchronization
7. Trim/fade/volume/mute/solo regression
8. Horizontal scrolling and timeline zoom
9. Individual playback regression
10. Full S14 composition test and baseline lock

## Explicitly out of scope for this redesign

- S15 persistence / Composition DB
- S16 export
- S18 media operations
- Cloudflare backend changes
- Sound generation architecture
- Voice generation architecture

S15 will persist the composition model after S14 has established and tested it.

## Acceptance scenarios

| Scenario | Required result |
|---|---|
| 30s Voice only | Timeline represents 30s accurately |
| 5min Sound only | Timeline represents 5min accurately |
| 30s Voice + 5min Sound | Both retain true durations on one timeline |
| Voice starts at 5s | Voice waveform begins at 5s on master timeline |
| Sound starts at 20s | Sound waveform begins at 20s on master timeline |
| Play All | One master clock controls composition position |
| Track before start | No active track playhead before its start |
| Track finished | Track playhead holds at its effective end |
| Individual playback | Local track playback works independently of master transport |
| Stop All | Master returns to 0 and all tracks reset |
| Trim | Source waveform remains intact; effective playback range changes |
| Cut at playhead | Two clip regions remain in the same lane, trims preserve outer source boundaries, the local playhead crosses the shared cut without flicker, and playback/export remains sequential |
| Long composition | Timeline scrolls rather than squeezing content |
| Zoom | Same seconds remain aligned across ruler and every track |

## Current implementation note

The existing S14 prototype is intentionally retained until the new composition model is implemented. No further playhead patches should be added to the old 30-second architecture.