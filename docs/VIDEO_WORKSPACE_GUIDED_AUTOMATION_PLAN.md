# SvaraOne Video — Guided Automation Redesign

## Product decision

Default mode: **Guided automation**.

The user directs the creative outcome. SvaraFlow manages the production process. The redesign changes the user experience, not the underlying product investment.

## User-facing journey

1. **Create** — The user describes an idea. SvaraFlow develops the concept, script, narration/dialogue plan, visual direction and storyboard. The user approves the creative direction before paid production assets are generated.
2. **Produce** — SvaraFlow coordinates characters, environments, scene visuals/video, voiceovers, character dialogue, music, ambience and sound effects. The user sees progress and can intervene, but does not approve every routine production operation.
3. **Finish** — SvaraFlow assembles the scenes and audio, checks the result, and presents a complete preview. The user can request targeted changes and export.

## Voice and audio are core production requirements

- Narration/voiceover is planned from the approved script and storyboard.
- Support a continuous narrator voice.
- Support distinct character voices and consistent voice assignment across scenes.
- Use the existing SvaraOne Voice Library and voice-generation capabilities; do not build a duplicate voice catalogue.
- Support expressive delivery, pacing and pronunciation controls where the existing provider capabilities allow.
- Coordinate background music, ambience and sound effects.
- Synchronise spoken audio with scene timing and lip-sync where supported.
- Allow targeted regeneration of a line, scene or audio element without restarting the entire project.

## Feature mapping

| Existing capability | New treatment |
|---|---|
| Creative Discovery | Create stage; simplify the brief and defaults |
| Storyline and storyboard | SvaraFlow prepares these; one meaningful creative approval |
| Branding / Brand Kit | Optional project settings; automatically apply saved assets |
| Character generation and library | Automated selection by default; optional review/override |
| Environment generation | Automated by default; optional review/override |
| Visual style and camera direction | SvaraFlow defaults; advanced overrides remain available |
| Scene generation | Background production task with visible progress |
| Voice library / TTS | Reuse existing Voice workspace and APIs through Video orchestration |
| Narration and character dialogue | Core production; not a future optional add-on |
| Music / ambience / SFX | Reuse Sound capabilities and coordinate automatically |
| Composition / lip-sync | Finish stage; preserve existing Compose capabilities where reusable |
| Project persistence | Preserve; verify resume/reopen behaviour |
| Export | Finish stage; complete/verify end-to-end pipeline |

## User approval policy

Required checkpoints:
- Approve the concept/storyboard before expensive production begins.
- Review the finished video before export.

Optional checkpoints:
- Change the recommended character, voice, visual style, music or individual scene.
- Open advanced controls for manual direction.

Do not require a separate approval for every generated candidate, environment, scene, voice line or sound asset when SvaraFlow can make a safe recommendation.

## Implementation guardrails

- Preserve existing working APIs, provider integrations, R2/D1 storage and project data.
- Do not delete existing capabilities; move advanced controls behind optional review.
- Do not claim a capability is automated until the orchestration path actually exists and has been tested.
- Work on the `video-guided-experience` branch; do not push redesign changes directly to `main`.
- Validate project creation, save, reopen, resume, existing projects, asset ownership, credits, voice generation, audio sync, video generation and export before release.

## Current implementation gaps identified during source review

- The visible workflow currently exposes seven separate stages and multiple approval gates.
- The Production panel still labels video generation and voice/music/sound integration as planned placeholders.
- Scene storyboard data already includes narration text, but the Video workflow does not yet generate and attach the corresponding voiceover/audio assets.
- Existing SvaraOne Voice and Sound workspaces should be integrated through orchestration rather than duplicated in Video.
- Runway scene generation exists, but full automated end-to-end assembly/export must be verified and completed.

## Rollout sequence

1. Simplify the visible workflow to Create / Produce / Finish while preserving the existing seven internal workflow states and project compatibility.
2. Simplify the Create experience and make branding/advanced direction optional.
3. Implement SvaraFlow production orchestration for character, environment and scene assets, with optional review.
4. Integrate narrator voice, character dialogue, music, ambience and sound effects using existing Voice/Sound services.
5. Complete assembly, preview, targeted revisions and export.
6. Regression-test existing saved projects and all current workspaces before merging.
