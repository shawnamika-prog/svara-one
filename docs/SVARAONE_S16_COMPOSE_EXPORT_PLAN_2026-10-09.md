# SvaraONE S16 — Composition Export & Mini-Library

**Date:** 2026-10-09  
**Branch:** main  
**Status:** S16.1 WAV-to-R2 export confirmed working by user. S16.2 MP3/PCM support and Composition mini-library code pushed; deployed verification pending.  
**Scope:** Render an existing Compose timeline, store export assets in R2 and make them reusable.

## Product behaviour

- **Play All / Stop All** remains the editor preview transport.
- **COMPOSE & EXPORT** is a separate header action.
- The export panel offers WAV, MP3 and PCM and updates the filename extension.
- Default name: `svaraone-composition-YYYY-MM-DD-HH-MM.wav` (extension follows the selected format).
- Saved compositions appear in the Composition mini-library beneath the Compose editor, with search, preview, download and **Use in Compose**.

## Export formats

| Format | Encoding | Storage MIME | Playback |
|---|---|---|---|
| WAV | RIFF/WAVE, 16-bit PCM, stereo, 44.1 kHz | `audio/wav` | Direct |
| MP3 | LAME encoder, stereo, 192 kbps, 44.1 kHz | `audio/mpeg` | Direct |
| PCM | Raw signed 16-bit big-endian L16, stereo, 24 kHz | `audio/l16;rate=24000;channels=2` | Preview endpoint wraps it as WAV and swaps sample byte order; download stays raw PCM |

The MP3 encoder is vendored as a separate, unmodified script at `public/js/vendor/lame.min.js`. Its upstream LGPL license and attribution are included in `public/js/vendor/LAMEJS-LICENSE.txt` and `public/js/vendor/NOTICE-lamejs.txt`. The script loads before the Studio app.

## Rendering behaviour

The browser decodes the referenced source assets and uses `OfflineAudioContext` to render one stereo mix. Track positions, trim boundaries, fades, volume, mute and solo are applied without modifying source files or live editor state. WAV and MP3 renders use 44.1 kHz; PCM is rendered directly at 24 kHz. A master peak adjustment is applied only when needed to reduce clipping risk.

## Cloudflare/R2 API

- `POST /api/compositions/export`: authenticated; validates format, byte length and format header; enforces an 80 MB upload cap; writes to the user-scoped `users/<userId>/compositions/<uuid>.<wav|mp3|pcm>` namespace in the existing `GENERATED_AUDIO` bucket. Uses the declared upload size with `FixedLengthStream`. Format, filename, duration, track count, sample rate and user ownership are stored as R2 object metadata.
- `GET /api/compositions`: authenticated listing of saved user compositions with filename, format, duration, size, creation time and asset URL. Search and limit parameters support the mini-library.
- `GET /api/compositions/assets/<id>`: authenticated user-scoped retrieval, correct content type/filename and byte-range support. `?download=1` downloads original encoded bytes. For PCM only, `?preview=1` streams a WAV wrapper for native HTML audio playback.

No D1 migration or full S15 editable-composition persistence has been added. Only finished export metadata is stored in R2.

## Composition mini-library

- Lives below the Compose editor and lists exported Composition assets only.
- Displays filename, format, duration, size and saved date.
- Supports search, audio preview, original-format download and **Use in Compose**.
- The existing Add Track finder now loads Composition exports from `/api/compositions` when Composition is selected. Imported PCM uses the WAV-preview URL so the editor can decode and play it.
- The listing is scoped by the signed-in user's R2 namespace. It does not replace or expand global My Library (S17).

## Limits and dependencies

- Exports are limited to 7 minutes and 80 MB.
- MP3 relies on the separately bundled LAME encoder and included license/attribution.
- The mini-library lists up to 100 items per response; the endpoint scans up to 1,000 R2 keys per request.
- S14's transport/editor behaviour remains locked. S15 composition-state persistence remains deferred.

## Verification record

**Previously confirmed by user**
- S16.1 WAV export → R2 save works in the deployed app after the R2 stream-length fix.

**Static checks for this extension**
- `public/js/studio-landing.js` syntax: passed.
- `worker/entry.js` syntax: passed.
- LAME script is loaded before the Studio app.
- A one-second test tone produced MP3 frames with an MPEG sync prefix.
- WAV encoder test passed for RIFF/WAVE, channels, sample rate, bit depth and consistent RIFF/data lengths.
- PCM encoder test passed for raw L16 byte length and big-endian signed samples.

**Still needs deployed browser verification**
- MP3 export → R2 → preview and original-format download.
- PCM export → R2 → WAV-wrapped preview and raw PCM download.
- Composition mini-library loads, searches, previews, downloads and imports saved exports.
- These behaviours are implemented but are not marked live-confirmed until exercised in the deployed app.

## Next sequence

1. Verify MP3 and PCM exports in the deployed app.
2. Verify Composition mini-library list, playback, download and reuse.
3. After these are confirmed, assess whether S15 (editable composition state persistence) should begin or whether user-observed fixes are needed. Do not add another persistence model by assumption.
