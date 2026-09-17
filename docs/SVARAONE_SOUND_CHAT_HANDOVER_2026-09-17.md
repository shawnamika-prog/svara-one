# SvaraONE Sound — Chat Handover

**Date:** 2026-09-17  
**Repository:** `shawnamika-prog/svara-one`  
**Branch:** `main`  
**Current main HEAD:** `da209e84c3d50846d69d5be83d1986b56bf6cc01`

## Read this first

The authoritative Sound tracker is:

`docs/SVARAONE_SOUND_MASTER_TRACKER.md`

It was updated immediately before this handover. Completed phases are locked. **Do not start S13 until the user explicitly confirms that the Sound Studio UI is complete.**

The Sound architecture uses Cloudflare, not Supabase. Do not introduce Supabase or invent a different storage/backend architecture.

## Product architecture

SvaraONE has three creative domains:

- Voice
- Sound
- Video

SvaraFlow is the orchestration layer and creative collaborator. Positioning:

**ENGINEERED INTELLIGENCE. HUMAN ORCHESTRATION.**

Sound is independently implemented behind provider adapters. Current provider execution is environment-driven; the active environment provider is Sonilo.

Universal/domain files include:

- `worker/svaraflow.js`
- `worker/svaraflow-voice.js`
- `worker/svaraflow-sound.js`
- `worker/svaraflow-sound-agent.js`
- `worker/svaraflow-video.js`
- `worker/svaraflow-scorm.js`
- `worker/providers/sound/base.js`
- `worker/providers/sound/index.js`
- `worker/providers/sound/sonilo.js`
- `worker/providers/sound/mubert.js`

Current Sound environment conventions:

- `SVARAONE_SOUND_PROVIDER`
- `SOUND_API_KEY`
- Sonilo base URL: `https://api.sonilo.com/v1`

Do not change these assumptions without inspecting the current source first.

## Locked Sound phase position

- **S0–S8:** complete / locked
- **S9:** foundation complete, final UI completion still in progress
- **S10–S12:** complete / locked
- **S13:** not started; explicitly blocked until S9 UI completion
- S14–S22: not started

Important commits:

- S9 UI foundation baseline: `033af03330db1a6b853225d3eb91d3b9eb1315b0`
- S12 final architecture commit: `4fc21c803c1ca012126c1ebbfc14e0a954be1ff1`
- Previous proposal Markdown presentation fix: `3065473932ce7cfd9969af01ce6027cba7045eb2`
- Latest UI wording commit before tracker update: `e84e31b2e3f402a67702733020a326cc7ee0c737`
- Current `main` after tracker update: `da209e84c3d50846d69d5be83d1986b56bf6cc01`

## What is currently working

The Existing Voice → Sound workflow has been advanced and manually tested:

**Select Existing Voice → choose Voice from compact Voice Library picker → Voice is imported into Sound → stored script/voice context is attached → SvaraFlow automatically starts → SvaraFlow proposes several Sound directions → creator collaborates → approval can lead to execution/generation.**

The picker uses the Voice Library rather than exposing the full library as a flat select. Folder/search behavior already exists.

The Voice waveform and playback presentation is working and should not be redesigned casually.

The selected Voice's stored script is structured context for SvaraFlow. It is not supposed to be treated as just another free-form Sound prompt.

The initial Existing Voice SvaraFlow turn is exploratory only: it must not approve or generate audio. The agent is asked to produce several distinct Sound directions plus one structured primary specification that the creator can refine or accept.

Approval is semantic/human-led. Praise, thanks, acknowledgement, retry, or vague dissatisfaction must not accidentally trigger generation. An actual decision to proceed requires an existing current/proposed specification.

## Current SvaraFlow UI architecture

Primary current UI file:

`public/js/sound-svaraflow-ui-v5.js`

Supporting files:

- `public/js/sound-svaraflow-conversation-fix.js`
- `public/js/sound-svaraflow-proposal-polish.js`
- `public/js/sound-svaraflow-voice-context.js`
- `public/js/sound-existing-voice-picker.js`
- `public/js/sound-existing-voice-picker-visibility.js`
- `public/js/sound-voice-input.js`
- `public/js/studio-landing.js`
- `public/js/sound-svaraflow-ui-v4.js`

`studio.html` loads the Sound/Studio CSS and JS layers; the Sound workspace itself is created dynamically by `public/js/studio-landing.js`.

Do not assume the old SvaraFlow v2/v3 implementation is the active source of truth. The v5 implementation is the current agent/UI layer, with older compatibility/polish scripts still present in the page.

## Latest user feedback — remaining S9 UI work

The user supplied a screenshot showing two remaining UI issues.

### 1. Structured specification header is still visually broken

The specification card currently creates this title in `public/js/sound-svaraflow-ui-v5.js`:

```js
const title=document.createElement('div');
title.className='sound-sf-spec-title';
title.innerHTML='<span>PROPOSED SOUND DIRECTION</span><span>SvaraFlow<sup class="sf-tm">TM</sup></span>';
```

The screenshot still showed the visual result effectively as:

**PROPOSED SOUND DIRECTIONSvaraFlow™**

The title/header needs a real layout fix. Do not assume the existing flex rule is actually winning; inspect the active CSS and loaded script order before changing it.

Desired visual hierarchy is approximately:

**PROPOSED SOUND DIRECTION**                 **SvaraFlow™**

with clear spacing/separation, no collision, and the existing proposal direction cards untouched.

Important: this is a presentation-only fix. Do not alter the structured specification data or agent behavior.

### 2. SvaraFlow conversation area is too short

The user explicitly asked to extend the height of the conversation panel/thread so more of the SvaraFlow conversation and proposals are visible.

The active v3 stylesheet originally defined:

```css
.sound-sf-thread{
  height:410px;
  max-height:48vh;
  overflow:auto;
  ...
}
```

The screenshot confirms the visible conversation region is still too short for the current multi-direction proposal flow.

The requested change is UI-only: increase the conversation/thread height while preserving the composer and right-side Output layout. Do not change agent behavior, provider routing, generation logic, or backend contracts.

A sensible starting point is to inspect the currently loaded/overriding `.sound-sf-thread` rules and then increase the desktop thread height. Preserve responsive behavior for mobile rather than applying an unbounded fixed height.

## Proposal Markdown polishing — already improved

`public/js/sound-svaraflow-proposal-polish.js` now converts OpenAI's raw Markdown proposal text into structured visual direction rows/cards.

It handles:

- numbered direction parsing
- titles and bodies
- optional `RECOMMENDED` badge
- first-person normalization of the old phrase `SvaraFlow has mapped the current creative direction here:` into `I have mapped the current creative direction here:`
- generic `**bold**` / `__bold__` fallback presentation

The user said the generated direction presentation was **much better** after this work.

Do not undo or redesign this successful presentation layer while fixing the two remaining UI issues.

## Direct Mode status

Direct Mode was already passed and locked. It is the escape hatch from SvaraFlow and does not disable SvaraONE.

Important behavior:

- SvaraFlow is the default Sound interaction.
- Provider/adapter-specific controls are exposed in Direct Mode.
- Capability metadata is normalized/cached.
- `.sound-adapter-meta` is hidden in the locked Direct Mode polish.
- Direct Mode copy and hover styling were manually tested.
- A previous MutationObserver loop was fixed; avoid introducing new observer loops.

## Existing Voice context status

`public/js/sound-svaraflow-voice-context.js` renders the context card above the conversation. It includes:

- `VOICEOVER CONTEXT`
- selected Voice name
- folder/script information
- preview
- explanation that the stored Voice script is context

The old separate **Suggest Sound directions** button was removed.

Selecting Existing Voice should automatically start the SvaraFlow exploratory turn.

New Voice selection clears the previous conversation/specification and starts the new context.

## SvaraFlow agent behavior to preserve

Sound agent uses the OpenAI Responses API.

Supported actions include:

- `propose`
- `refine`
- `clarify`
- `question`
- `respond`
- `approve`

The agent contract contains one structured `specification` plus a natural-language `response`. The response can discuss several alternatives while the structured `specification` represents one primary/recommended direction.

Approval hardening already exists. It requires an actual decision to proceed and an existing current/proposed specification. Do not weaken this logic during UI work.

Duration constraints must not be silently violated.

Current agent request path has a hard 30-second agent timeout.

## Sound backend and data — locked for S9 UI work

Do not modify these while working on the current UI issues unless a real defect is proven from source/testing.

Sound services include:

- `text_to_music`
- `video_to_music`
- `text_to_sfx`
- `video_to_sfx`
- `video_to_sound`
- `audio_ducking`

Provider contract includes:

- `generate()`
- `getResult()`
- `discoverCapabilities()`
- `getVersion()`
- `normalizeResult()`
- `getStatus()`

Sound persistence uses Cloudflare D1 and R2. `sound_generations` and related input/parameter/composition tables are already in place.

Credits are already validated/refunded idempotently. Current universal factor is `SVARAONE_CREDIT_FACTOR=2`. A 30-second Sound generation currently corresponds to 60 customer credits under the established model.

Do not change the credit model or schema as part of these UI fixes.

## Development discipline for the next chat

The user expects source-first, exact-state engineering.

Before making a change:

1. Fetch `main` and verify the exact current HEAD.
2. Read the exact current file(s) involved.
3. Make the smallest focused change possible.
4. Write directly to `main` using the current blob SHA.
5. Report the exact resulting commit SHA.
6. Test one change at a time and wait for user feedback before stacking unrelated UI changes.

Do not invent file contents, SHAs, architecture, providers, storage systems, or behavior.

Do not begin S13 yet.

## Immediate next task

Fix these two UI issues only:

1. Make the **PROPOSED SOUND DIRECTION / SvaraFlow™** specification header visually separate and polished.
2. Increase the vertical height of the **SvaraFlow conversation thread/panel** so the creator can see substantially more of the conversation without changing the composer or Output panel behavior.

Then ask the user to test the new UI before doing anything else.

## One-line continuation prompt

> Read `docs/SVARAONE_SOUND_MASTER_TRACKER.md` and this handover first. Verify current `main` HEAD and inspect the exact active S9 UI files before coding. Then fix only the two remaining S9 UI issues: the colliding specification header and the too-short SvaraFlow conversation thread. Do not start S13, do not change backend/agent/provider behavior, and make one small change at a time.